import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { recordAudit } from '../services/audit.js';
import { userCompanyRole } from '../services/companyAccess.js';

function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return s;
}

/**
 * Socket.IO server with JWT auth and room-scoped chat.
 * Mirrors REST validation in conversationController.sendMessage.
 */
export function attachChatServer(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));
      const payload = jwt.verify(token, getJwtSecret());
      const user = await User.findById(payload.sub).select('-passwordHash');
      if (!user) return next(new Error('Unauthorized'));
      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    socket.on('conversation:join', async ({ conversationId }, cb) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv) return cb?.({ error: 'Not found' });
        const allowed = conv.participants.some((p) => p.user.toString() === socket.userId);
        if (!allowed) return cb?.({ error: 'Forbidden' });
        socket.join(`conversation:${conversationId}`);
        cb?.({ ok: true });
      } catch (e) {
        cb?.({ error: 'join failed' });
      }
    });

    socket.on('message:send', async (payload, cb) => {
      try {
        const { conversationId, type, body, attachmentUrl, attachmentName } = payload || {};
        if (!conversationId) return cb?.({ error: 'conversationId required' });
        const conv = await Conversation.findById(conversationId).populate('company');
        if (!conv) return cb?.({ error: 'Not found' });
        const participant = conv.participants.find((p) => p.user.toString() === socket.userId);
        if (!participant) return cb?.({ error: 'Forbidden' });

        const u = await User.findById(socket.userId);
        const other = conv.participants.find((p) => p.user.toString() !== socket.userId);
        const otherUser = await User.findById(other.user);
        if (!u || u.kycStatus !== 'verified' || !otherUser || otherUser.kycStatus !== 'verified') {
          return cb?.({ error: 'Both parties must be identity-verified' });
        }

        const company = conv.company;
        const roleOnCompany = userCompanyRole(company, socket.userId);
        const msgType = type === 'document' ? 'document' : 'text';
        if (roleOnCompany === 'representative') {
          const rep = company.representatives.find((r) => r.user.toString() === socket.userId);
          if (msgType === 'text' && rep && !rep.canChat) {
            return cb?.({ error: 'Chat not permitted for this representative role' });
          }
          if (msgType === 'document' && rep && !rep.canShareDocuments) {
            return cb?.({ error: 'Document sharing not permitted for this representative role' });
          }
        }

        const textBody = body || '';
        const attUrl = attachmentUrl || '';
        const attName = attachmentName || '';
        if (msgType === 'text' && !textBody.trim()) return cb?.({ error: 'body required' });
        if (msgType === 'document' && !attUrl) return cb?.({ error: 'attachmentUrl required' });

        const msg = await Message.create({
          conversation: conv._id,
          sender: socket.userId,
          type: msgType,
          body: msgType === 'text' ? textBody : textBody || 'Document shared',
          attachmentUrl: attUrl,
          attachmentName: attName,
        });
        await recordAudit({
          actor: socket.userId,
          action: 'MESSAGE_SENT',
          resource: `conversation:${conv._id}`,
          metadata: { type: msgType, messageId: msg._id, channel: 'websocket' },
          ip: socket.handshake.address,
        });
        conv.updatedAt = new Date();
        await conv.save();

        const out = msg.toObject();
        io.to(`conversation:${conversationId}`).emit('message:new', { message: out });
        cb?.({ ok: true, message: out });
      } catch (e) {
        console.error(e);
        cb?.({ error: 'send failed' });
      }
    });
  });
}
