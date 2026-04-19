import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import BadgeStrip from '../components/BadgeStrip.jsx';

export default function Dashboard() {
  const { user, refreshMe } = useAuth();
  const [trust, setTrust] = useState(null);
  const [govId, setGovId] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/trust/summary');
        setTrust(data);
      } catch {
        /* ignore */
      }
    })();
  }, [user?.kycStatus]);

  async function submitKyc(e) {
    e.preventDefault();
    if (!govId || !selfie) {
      setMsg('Please select both ID and selfie images.');
      return;
    }
    setBusy(true);
    setMsg('');
    const fd = new FormData();
    fd.append('governmentId', govId);
    fd.append('selfie', selfie);
    try {
      await api.post('/kyc/submit', fd);
      await refreshMe();
      const { data } = await api.get('/trust/summary');
      setTrust(data);
      setMsg('KYC submitted — pending review (mock compliance).');
    } catch (err) {
      setMsg(err.response?.data?.error || 'KYC submission failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-slate-400 mt-2 max-w-2xl">
          TrustBridge enforces server-side verification before any investor–founder communication. Complete
          identity checks, then company verification on the Company page.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-white/10 bg-bridge-900/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Identity & trust</h2>
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="text-sm text-slate-500">Trust score</div>
              <div className="text-3xl font-bold text-sky-300">{trust?.user?.trustScore ?? user?.trustScore ?? '—'}</div>
            </div>
            <div className="text-right text-sm text-slate-400">
              KYC: <span className="text-slate-200 capitalize">{user?.kycStatus}</span>
            </div>
          </div>
          <BadgeStrip badges={trust?.badges || []} />
          {user?.genericEmailDomain && (
            <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              Consumer email domain detected — institutional counterparties may require a work domain.
            </p>
          )}
          {user?.multiCompanyWarning && (
            <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              You are linked to multiple companies — review for potential intermediary risk.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-bridge-900/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold">KYC submission (mock)</h2>
          <p className="text-sm text-slate-400">
            Upload a government ID and selfie. A reviewer endpoint approves KYC to reach{' '}
            <code className="text-sky-300">verified</code> status.
          </p>
          <form onSubmit={submitKyc} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Government ID</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setGovId(e.target.files?.[0] || null)}
                className="text-sm text-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Selfie / liveness</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelfie(e.target.files?.[0] || null)}
                className="text-sm text-slate-300"
              />
            </div>
            {msg && <p className="text-sm text-slate-300">{msg}</p>}
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-bridge-950 font-semibold text-sm disabled:opacity-50"
            >
              {busy ? 'Uploading…' : 'Submit KYC'}
            </button>
          </form>
        </section>
      </div>

      <section className="rounded-2xl border border-dashed border-white/15 bg-bridge-900/30 p-6">
        <h2 className="text-lg font-semibold mb-2">Compliance reviewer (local)</h2>
        <p className="text-sm text-slate-400 mb-4">
          Approve pending KYC with{' '}
          <code className="text-sky-300">curl</code> using <code className="text-sky-300">ADMIN_SECRET</code> — see{' '}
          <code className="text-sky-300">server/.env.example</code>.
        </p>
        <pre className="text-xs bg-bridge-950 border border-white/10 rounded-xl p-4 overflow-x-auto text-slate-300">
{`curl -X POST http://localhost:4000/api/admin/kyc/YOUR_USER_ID/review \\
  -H "Content-Type: application/json" \\
  -H "x-admin-secret: $ADMIN_SECRET" \\
  -d '{"approve":true}'`}
        </pre>
        <p className="text-sm text-slate-500 mt-4">
          After KYC is verified, founders can register a company on the{' '}
          <Link className="text-sky-400 hover:underline" to="/company">
            Company
          </Link>{' '}
          page. Investors can open verified threads from{' '}
          <Link className="text-sky-400 hover:underline" to="/messages">
            Messages
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
