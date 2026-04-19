import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';

export default function Company() {
  const { user, refreshMe } = useAuth();
  const [mine, setMine] = useState({ founder: [], representative: [] });
  const [form, setForm] = useState({
    name: '',
    legalName: '',
    officialDomain: '',
    domainVerificationMethod: 'email',
  });
  const [dnsToken, setDnsToken] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await api.get('/companies/mine');
    setMine(data);
    if (data.founder?.[0] && !selectedId) setSelectedId(data.founder[0]._id);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const active = mine.founder.find((c) => c._id === selectedId);

  async function createCompany(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const { data } = await api.post('/companies', form);
      setMsg('Company created — upload registration doc, verify domain, then request admin review.');
      if (data.company?._id) setSelectedId(data.company._id);
      await load();
      await refreshMe();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Could not create company');
    } finally {
      setBusy(false);
    }
  }

  async function uploadReg(e) {
    e.preventDefault();
    const file = e.target.elements.file?.files?.[0];
    if (!active || !file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/companies/${active._id}/registration-doc`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMsg('Registration document uploaded.');
      await load();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  async function verifyDomain() {
    if (!active) return;
    setBusy(true);
    try {
      await api.post(`/companies/${active._id}/domain/verify`, {
        dnsToken: active.domainVerificationMethod === 'dns' ? dnsToken : undefined,
      });
      setMsg('Domain verified (mock).');
      await load();
    } catch (err) {
      setMsg(err.response?.data?.error || err.response?.data?.hint || 'Verification failed');
    } finally {
      setBusy(false);
    }
  }

  async function inviteRep(e) {
    e.preventDefault();
    if (!active) return;
    setBusy(true);
    try {
      await api.post(`/companies/${active._id}/representatives`, { email: inviteEmail });
      setMsg('Invitation recorded — representative must be KYC-verified; founder approves in list.');
      setInviteEmail('');
      await load();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Invite failed');
    } finally {
      setBusy(false);
    }
  }

  async function approveRep(uid) {
    if (!active) return;
    setBusy(true);
    try {
      await api.patch(`/companies/${active._id}/representatives/${uid}/approve`);
      await load();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Approve failed');
    } finally {
      setBusy(false);
    }
  }

  if (user?.accountType !== 'founder_candidate') {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold mb-2">Company verification</h1>
        <p className="text-slate-400">
          Switch to the founder path at registration to register a company. Investors can participate in
          verified threads without creating a company.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Company verification</h1>
        <p className="text-slate-400 mt-2 max-w-2xl">
          Only <span className="text-slate-200">KYC-verified</span> founder accounts may claim a company.
          Provide registration documents and prove domain control (email match or DNS token mock).
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <form
          onSubmit={createCompany}
          className="space-y-4 rounded-2xl border border-white/10 bg-bridge-900/50 p-6"
        >
          <h2 className="text-lg font-semibold">Register company</h2>
          <div>
            <label className="text-xs text-slate-500">Name</label>
            <input
              className="w-full mt-1 rounded-lg bg-bridge-950 border border-white/10 px-3 py-2"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Legal name (optional)</label>
            <input
              className="w-full mt-1 rounded-lg bg-bridge-950 border border-white/10 px-3 py-2"
              value={form.legalName}
              onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Official domain</label>
            <input
              className="w-full mt-1 rounded-lg bg-bridge-950 border border-white/10 px-3 py-2"
              placeholder="acme.com"
              value={form.officialDomain}
              onChange={(e) => setForm((f) => ({ ...f, officialDomain: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Domain verification</label>
            <select
              className="w-full mt-1 rounded-lg bg-bridge-950 border border-white/10 px-3 py-2"
              value={form.domainVerificationMethod}
              onChange={(e) => setForm((f) => ({ ...f, domainVerificationMethod: e.target.value }))}
            >
              <option value="email">Work email on domain</option>
              <option value="dns">DNS TXT token (mock)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={busy || user?.kycStatus !== 'verified'}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-bridge-950 font-semibold text-sm disabled:opacity-40"
          >
            {user?.kycStatus !== 'verified' ? 'Complete KYC first' : 'Create company'}
          </button>
        </form>

        <div className="space-y-6">
          {mine.founder.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-bridge-900/50 p-6 space-y-4">
              <h2 className="text-lg font-semibold">Your companies</h2>
              <select
                className="w-full rounded-lg bg-bridge-950 border border-white/10 px-3 py-2"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {mine.founder.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} — {c.verificationStatus}
                  </option>
                ))}
              </select>
              {active && (
                <div className="text-sm text-slate-400 space-y-2">
                  <p>
                    Domain verified:{' '}
                    <span className="text-slate-200">{active.domainVerified ? 'yes' : 'no'}</span>
                  </p>
                  <p>
                    Registration doc:{' '}
                    <span className="text-slate-200">{active.registrationDocumentUrl ? 'uploaded' : 'missing'}</span>
                  </p>
                  <p>
                    Status: <span className="text-slate-200 capitalize">{active.verificationStatus}</span>
                  </p>
                  {active.domainVerificationMethod === 'dns' && (
                    <div>
                      <p className="text-[11px] text-slate-500 break-all">
                        Expected TXT: <code className="text-sky-300">trustbridge-verify={active.domainVerificationToken}</code>
                      </p>
                      <label className="text-xs text-slate-500">Paste token to confirm</label>
                      <input
                        className="w-full mt-1 rounded-lg bg-bridge-950 border border-white/10 px-3 py-2 text-xs"
                        value={dnsToken}
                        onChange={(e) => setDnsToken(e.target.value)}
                        placeholder={active.domainVerificationToken || 'paste token'}
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={verifyDomain}
                      disabled={busy}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/90 hover:bg-sky-400 text-bridge-950 text-xs font-semibold"
                    >
                      Verify domain (mock)
                    </button>
                  </div>
                  <form onSubmit={uploadReg} className="pt-2 border-t border-white/10">
                    <label className="text-xs text-slate-500">Registration PDF / image</label>
                    <input type="file" name="file" className="block text-xs mt-1 text-slate-300" />
                    <button
                      type="submit"
                      disabled={busy}
                      className="mt-2 px-3 py-1.5 rounded-lg border border-white/15 text-xs hover:bg-white/5"
                    >
                      Upload document
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {active && (
            <div className="rounded-2xl border border-white/10 bg-bridge-900/50 p-6 space-y-3">
              <h3 className="font-semibold">Representatives</h3>
              <form onSubmit={inviteRep} className="flex flex-col sm:flex-row gap-2">
                <input
                  className="flex-1 rounded-lg bg-bridge-950 border border-white/10 px-3 py-2 text-sm"
                  placeholder="invitee@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm"
                >
                  Invite
                </button>
              </form>
              <ul className="text-sm text-slate-400 space-y-2">
                {active.representatives?.map((r) => (
                  <li
                    key={r.user}
                    className="flex items-center justify-between gap-2 border border-white/5 rounded-lg px-3 py-2"
                  >
                    <span className="font-mono text-xs">{r.user}</span>
                    <span className="text-xs">
                      {r.approvedByFounder ? (
                        <span className="text-emerald-300">approved</span>
                      ) : (
                        <button
                          type="button"
                          className="text-sky-300 hover:underline"
                          onClick={() => approveRep(r.user)}
                        >
                          Approve
                        </button>
                      )}
                    </span>
                  </li>
                ))}
                {(!active.representatives || active.representatives.length === 0) && (
                  <li className="text-slate-500">No representatives yet.</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {msg && (
        <div className="rounded-xl border border-white/10 bg-bridge-950/80 px-4 py-3 text-sm text-slate-200">
          {msg}
        </div>
      )}

      <section className="rounded-2xl border border-dashed border-white/15 bg-bridge-900/30 p-6">
        <h2 className="text-lg font-semibold mb-2">Approve company (admin)</h2>
        <pre className="text-xs bg-bridge-950 border border-white/10 rounded-xl p-4 overflow-x-auto text-slate-300">
{`curl -X POST http://localhost:4000/api/admin/companies/COMPANY_ID/review \\
  -H "Content-Type: application/json" \\
  -H "x-admin-secret: $ADMIN_SECRET" \\
  -d '{"approve":true}'`}
        </pre>
      </section>
    </div>
  );
}
