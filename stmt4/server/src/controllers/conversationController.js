import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import { recordAudit } from '../services/audit.js';
import { userCompanyRole, isApprovedRep } from '../services/companyAccess.js';
import { canActAsCompanyDealParty } from '../middleware/antiBroker.js';

async function assertMessagingAllowed(company, companyUserId) {
  const u = await User.findById(companyUserId);
  if (!u || u.kycStatus !== 'verified') throw new Error('PARTY_NOT_VERIFIED');
  if (company.verificationStatus !== 'verified') throw new Error('COMPANY_NOT_VERIFIED');
  const role = userCompanyRole(company, companyUserId);
  if (!role) throw new Error('NOT_COMPANY_MEMBER');
  if (role === 'representative' && !isApprovedRep(company, companyUserId)) {
    throw new Error('REP_NOT_APPROVED');
  }
  return role;
}

/**
 * Creates a conversation between a verified investor and verified founder/rep.
 */
export async function createConversation(req, res) {
  try {
    const { companyId, companyUserId } = req.body;
    if (!companyId || !companyUserId) {
      return res.status(400).json({ error: 'companyId and companyUserId required' });
    }
    const investor = await User.findById(req.userId);
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    if (investor.kycStatus !== 'verified') {
      return res.status(403).json({ error: 'You must complete identity verification' });
    }
    if (investor.accountType !== 'investor') {
      return res.status(403).json({ error: 'Only investor accounts may start investor-side threads' });
    }
    let companyRole;
    try {
      companyRole = await assertMessagingAllowed(company, companyUserId);
    } catch (e) {
      const map = {
        PARTY_NOT_VERIFIED: 'Company participant must be verified',
        COMPANY_NOT_VERIFIED: 'Company must be verified before messaging',
        NOT_COMPANY_MEMBER: 'User is not a founder or representative of this company',
        REP_NOT_APPROVED: 'Representative must be approved by the founder',
      };
      return res.status(403).json({ error: map[e.message] || 'Messaging not allowed' });
    }
    const existing = await Conversation.findOne({
      company: companyId,
      $and: [
        { participants: { $elemMatch: { user: req.userId } } },
        { participants: { $elemMatch: { user: companyUserId } } },
      ],
    });
    if (existing) return res.json({ conversation: existing });

    const conv = await Conversation.create({
      company: companyId,
      participants: [
        { user: req.userId, role: 'investor' },
        {
          user: companyUserId,
          role: companyRole === 'founder' ? 'founder' : 'representative',
        },
      ],
      dealStage: 'messaging',
      founderDealApprovalRequired: companyRole === 'representative',
    });
    await recordAudit({
      actor: req.userId,
      action: 'CONVERSATION_CREATE',
      resource: `conversation:${conv._id}`,
      metadata: { companyId, companyUserId },
      ip: req.ip,
    });
    res.status(201).json({ conversation: conv });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not create conversation' });
  }
}

/** Founder or approved rep may also open a thread toward a verified investor. */
export async function createConversationFromCompany(req, res) {
  try {
    const { companyId, investorUserId } = req.body;
    if (!companyId || !investorUserId) {
      return res.status(400).json({ error: 'companyId and investorUserId required' });
    }
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    const dealParty = canActAsCompanyDealParty(company, req.userId);
    if (!dealParty.ok) {
      return res.status(403).json({ error: 'Only founder or approved representative may initiate' });
    }
    const investor = await User.findById(investorUserId);
    if (!investor || investor.accountType !== 'investor' || investor.kycStatus !== 'verified') {
      return res.status(403).json({ error: 'Counterparty must be a verified investor' });
    }
    if (company.verificationStatus !== 'verified') {
      return res.status(403).json({ error: 'Company must be verified' });
    }
    const self = await User.findById(req.userId);
    if (self.kycStatus !== 'verified') {
      return res.status(403).json({ error: 'Identity verification required' });
    }
    const companyRole = dealParty.role === 'founder' ? 'founder' : 'representative';
    const existing = await Conversation.findOne({
      company: companyId,
      $and: [
        { participants: { $elemMatch: { user: req.userId } } },
        { participants: { $elemMatch: { user: investorUserId } } },
      ],
    });
    if (existing) return res.json({ conversation: existing });
    const conv = await Conversation.create({
      company: companyId,
      participants: [
        { user: investorUserId, role: 'investor' },
        { user: req.userId, role: companyRole },
      ],
      dealStage: 'messaging',
      founderDealApprovalRequired: companyRole === 'representative',
    });
    await recordAudit({
      actor: req.userId,
      action: 'CONVERSATION_CREATE_COMPANY_SIDE',
      resource: `conversation:${conv._id}`,
      metadata: { companyId, investorUserId },
      ip: req.ip,
    });
    res.status(201).json({ conversation: conv });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not create conversation' });
  }
}

export async function listConversations(req, res) {
  const list = await Conversation.find({
    'participants.user': req.userId,
  })
    .populate('company')
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ conversations: list });
}

export async function getConversation(req, res) {
  const conv = await Conversation.findById(req.params.id).populate('company').lean();
  if (!conv) return res.status(404).json({ error: 'Not found' });
  const allowed = conv.participants.some((p) => p.user.toString() === req.userId);
  if (!allowed) return res.status(403).json({ error: 'Forbidden' });
  res.json({ conversation: conv });
}

/**
 * Lists messages (REST fallback; WebSocket used for live).
 */
export async function listMessages(req, res) {
  const conv = await Conversation.findById(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Not found' });
  const allowed = conv.participants.some((p) => p.user.toString() === req.userId);
  if (!allowed) return res.status(403).json({ error: 'Forbidden' });
  const messages = await Message.find({ conversation: conv._id })
    .sort({ createdAt: 1 })
    .limit(500)
    .lean();
  res.json({ messages });
}

export async function sendMessage(req, res) {
  try {
    const conv = await Conversation.findById(req.params.id).populate('company');
    if (!conv) return res.status(404).json({ error: 'Not found' });
    const participant = conv.participants.find((p) => p.user.toString() === req.userId);
    if (!participant) return res.status(403).json({ error: 'Forbidden' });

    const u = await User.findById(req.userId);
    const other = conv.participants.find((p) => p.user.toString() !== req.userId);
    const otherUser = await User.findById(other.user);
    if (!u || u.kycStatus !== 'verified' || !otherUser || otherUser.kycStatus !== 'verified') {
      return res.status(403).json({ error: 'Both parties must be identity-verified to exchange messages' });
    }

    const company = conv.company;
    const roleOnCompany = userCompanyRole(company, req.userId);
    if (roleOnCompany === 'representative') {
      const rep = company.representatives.find((r) => r.user.toString() === req.userId);
      const type = req.body.type === 'document' ? 'document' : 'text';
      if (type === 'text' && rep && !rep.canChat) {
        return res.status(403).json({ error: 'Your representative role does not include chat' });
      }
      if (type === 'document' && rep && !rep.canShareDocuments) {
        return res.status(403).json({ error: 'Your representative role does not include document sharing' });
      }
    }

    const type = req.body.type === 'document' ? 'document' : 'text';
    const body = req.body.body || '';
    const attachmentUrl = req.body.attachmentUrl || '';
    const attachmentName = req.body.attachmentName || '';
    if (type === 'text' && !body.trim()) return res.status(400).json({ error: 'Message body required' });
    if (type === 'document' && !attachmentUrl) return res.status(400).json({ error: 'attachmentUrl required for documents' });

    const msg = await Message.create({
      conversation: conv._id,
      sender: req.userId,
      type,
      body: type === 'text' ? body : body || 'Document shared',
      attachmentUrl,
      attachmentName,
    });
    await recordAudit({
      actor: req.userId,
      action: 'MESSAGE_SENT',
      resource: `conversation:${conv._id}`,
      metadata: { type, messageId: msg._id },
      ip: req.ip,
    });
    conv.updatedAt = new Date();
    await conv.save();
    res.status(201).json({ message: msg });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Send failed' });
  }
}

/**
 * Checkpoint: re-verify both parties and company, then advance deal state.
 */
export async function proceedToDeal(req, res) {
  try {
    const conv = await Conversation.findById(req.params.id).populate('company');
    if (!conv) return res.status(404).json({ error: 'Not found' });
    const participant = conv.participants.find((p) => p.user.toString() === req.userId);
    if (!participant) return res.status(403).json({ error: 'Forbidden' });

    const company = conv.company;
    if (company.verificationStatus !== 'verified') {
      return res.status(403).json({ error: 'Company must remain verified to proceed' });
    }

    const users = await User.find({ _id: { $in: conv.participants.map((p) => p.user) } });
    if (users.some((x) => x.kycStatus !== 'verified')) {
      return res.status(403).json({ error: 'All participants must remain identity-verified' });
    }

    const companyParticipant = conv.participants.find((p) => p.role === 'founder' || p.role === 'representative');
    const isRepThread = !!(companyParticipant && companyParticipant.role === 'representative');

    if (participant.role === 'investor') {
      if (isRepThread) {
        conv.dealStage = 'deal_pending_founder';
        conv.founderDealApprovalRequired = true;
      } else {
        conv.dealStage = 'deal_active';
      }
    } else {
      const dealParty = canActAsCompanyDealParty(company, req.userId);
      if (!dealParty.ok) {
        return res.status(403).json({ error: 'Only founder or approved representative may advance deals' });
      }
      if (conv.dealStage === 'deal_pending_founder') {
        if (dealParty.role !== 'founder') {
          return res.status(403).json({ error: 'Founder approval is required when a representative is involved' });
        }
        conv.founderApprovedDealAt = new Date();
        conv.dealStage = 'deal_active';
        conv.founderDealApprovalRequired = false;
      } else if (conv.dealStage === 'messaging') {
        if (isRepThread) {
          conv.dealStage = 'deal_pending_founder';
          conv.founderDealApprovalRequired = true;
        } else if (dealParty.role === 'founder') {
          conv.dealStage = 'deal_active';
        } else {
          return res.status(403).json({
            error: 'A representative cannot move to deal without founder approval in the workflow',
          });
        }
      } else {
        return res.status(400).json({ error: 'Invalid deal transition for current stage' });
      }
    }

    await conv.save();
    await recordAudit({
      actor: req.userId,
      action: 'DEAL_PROCEED',
      resource: `conversation:${conv._id}`,
      metadata: { dealStage: conv.dealStage },
      ip: req.ip,
    });
    res.json({ conversation: conv });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not update deal' });
  }
}
