import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api, { loadStoredToken } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [peerUserId, setPeerUserId] = useState('');
  const [dealNote, setDealNote] = useState('');
  const [busy, setBusy] = useState(false);
  const socketRef = useRef(null);
  const activeIdRef = useRef('');
  const bottomRef = useRef(null);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const active = useMemo(
    () => conversations.find((c) => c._id === activeId),
    [conversations, activeId]
  );

  async function refreshList() {
    const { data } = await api.get('/conversations');
    setConversations(data.conversations || []);
  }

  useEffect(() => {
    refreshList().catch(() => {});
  }, []);

  useEffect(() => {
    const token = loadStoredToken();
    if (!token) return undefined;
    const s = io({
      path: '/socket.io',
      transports: ['websocket'],
      auth: { token },
    });
    socketRef.current = s;
    s.on('message:new', ({ message }) => {
      const convId =
        typeof message.conversation === 'string' ? message.conversation : message.conversation?._id;
      if (String(convId || '') !== String(activeIdRef.current || '')) return;
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
    });
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    (async () => {
      const { data } = await api.get(`/conversations/${activeId}/messages`);
      setMessages(data.messages || []);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    })();
    const s = socketRef.current;
    if (s) {
      s.emit('conversation:join', { conversationId: activeId }, () => {});
    }
  }, [activeId]);

  async function startConversation() {
    if (!companyId || !peerUserId) return;
    setBusy(true);
    setDealNote('');
    try {
      let res;
      if (user.accountType === 'investor') {
        res = await api.post('/conversations', { companyId, companyUserId: peerUserId });
      } else {
        res = await api.post('/conversations/from-company', { companyId, investorUserId: peerUserId });
      }
      setActiveId(res.data.conversation._id);
      await refreshList();
      setDealNote('Conversation created — messaging is allowed only between verified parties.');
    } catch (err) {
      setDealNote(err.response?.data?.error || 'Could not create conversation');
    } finally {
      setBusy(false);
    }
  }

  function sendSocket() {
    const s = socketRef.current;
    if (!s || !activeId || !text.trim()) return;
    s.emit('message:send', { conversationId: activeId, type: 'text', body: text }, (ack) => {
      if (ack?.error) setDealNote(ack.error);
    });
    setText('');
  }

  async function uploadAndSend(e) {
    const file = e.target.files?.[0];
    if (!file || !activeId) return;
    setBusy(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post('/uploads/document', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await api.post(`/conversations/${activeId}/messages`, {
        type: 'document',
        body: file.name,
        attachmentUrl: data.url,
        attachmentName: data.name,
      });
      const hist = await api.get(`/conversations/${activeId}/messages`);
      setMessages(hist.data.messages || []);
    } catch (err) {
      setDealNote(err.response?.data?.error || 'Document send failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  async function proceedDeal() {
    if (!activeId) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/conversations/${activeId}/proceed-deal`);
      setDealNote(`Deal stage: ${data.conversation.dealStage}`);
      await refreshList();
    } catch (err) {
      setDealNote(err.response?.data?.error || 'Validation failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Messaging</h1>
          <p className="text-sm text-slate-400 mt-1">
            WebSocket transport with REST audit. Only verified investors and verified founder/rep pairs on
            verified companies.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-bridge-900/50 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">Start conversation</h2>
          <input
            className="w-full rounded-lg bg-bridge-950 border border-white/10 px-3 py-2 text-sm"
            placeholder="Company ID"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          />
          <input
            className="w-full rounded-lg bg-bridge-950 border border-white/10 px-3 py-2 text-sm"
            placeholder={user.accountType === 'investor' ? 'Founder / rep user ID' : 'Investor user ID'}
            value={peerUserId}
            onChange={(e) => setPeerUserId(e.target.value)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={startConversation}
            className="w-full py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-bridge-950 text-sm font-semibold disabled:opacity-50"
          >
            {user.accountType === 'investor' ? 'Message founder / rep' : 'Message investor'}
          </button>
          {dealNote && <p className="text-xs text-amber-200/90">{dealNote}</p>}
        </div>
        <div className="rounded-2xl border border-white/10 bg-bridge-900/50 p-2">
          <h2 className="text-xs uppercase tracking-wide text-slate-500 px-2 py-1">Threads</h2>
          <ul className="space-y-1 max-h-64 overflow-y-auto">
            {conversations.map((c) => (
              <li key={c._id}>
                <button
                  type="button"
                  onClick={() => setActiveId(c._id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    c._id === activeId ? 'bg-bridge-800 text-white' : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="font-medium truncate">{c.company?.name || 'Company'}</div>
                  <div className="text-[11px] text-slate-500 truncate">Deal: {c.dealStage}</div>
                </button>
              </li>
            ))}
            {conversations.length === 0 && (
              <li className="text-sm text-slate-500 px-3 py-2">No conversations yet.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-bridge-900/40 flex flex-col min-h-[480px]">
        <div className="border-b border-white/10 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{active?.company?.name || 'Select a thread'}</div>
            {active && (
              <div className="text-xs text-slate-500">
                Stage: <span className="text-slate-300">{active.dealStage}</span>
                {active.founderDealApprovalRequired && (
                  <span className="text-amber-300"> · Founder approval required</span>
                )}
              </div>
            )}
          </div>
          {active && (
            <button
              type="button"
              disabled={busy}
              onClick={proceedDeal}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/90 hover:bg-emerald-400 text-bridge-950 font-semibold disabled:opacity-50"
            >
              Proceed to deal
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((m) => (
            <div
              key={m._id}
              className={`flex ${String(m.sender) === String(user?._id) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  String(m.sender) === String(user?._id) ? 'bg-sky-600 text-white' : 'bg-white/5 text-slate-100'
                }`}
              >
                {m.type === 'document' ? (
                  <div>
                    <div className="text-xs uppercase text-slate-300/80">Document</div>
                    <a
                      href={m.attachmentUrl}
                      className="text-sky-200 underline break-all"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {m.attachmentName || m.body}
                    </a>
                  </div>
                ) : (
                  <span>{m.body}</span>
                )}
                <div className="text-[10px] text-slate-400 mt-1">
                  {new Date(m.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        {active && (
          <div className="border-t border-white/10 p-3 flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg bg-bridge-950 border border-white/10 px-3 py-2 text-sm"
                placeholder="Type a message…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendSocket()}
              />
              <button
                type="button"
                onClick={sendSocket}
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-bridge-950 text-sm font-semibold"
              >
                Send
              </button>
            </div>
            <label className="text-xs text-slate-500">
              Attach document (uploads via Cloudinary or mock)
              <input type="file" className="block mt-1 text-slate-300" onChange={uploadAndSend} disabled={busy} />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
