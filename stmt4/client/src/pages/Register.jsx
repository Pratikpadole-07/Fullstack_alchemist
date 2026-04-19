import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    accountType: 'investor',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Create account</h1>
      <p className="text-slate-400 text-sm mb-6">
        Choose investor access or the founder path to register a company after KYC.
      </p>
      <form onSubmit={onSubmit} className="space-y-4 bg-bridge-900/60 border border-white/10 rounded-2xl p-6">
        {error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Full name</label>
          <input
            className="w-full rounded-lg bg-bridge-950 border border-white/10 px-3 py-2 outline-none focus:border-sky-500/60"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Email</label>
          <input
            className="w-full rounded-lg bg-bridge-950 border border-white/10 px-3 py-2 outline-none focus:border-sky-500/60"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            type="email"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Password</label>
          <input
            className="w-full rounded-lg bg-bridge-950 border border-white/10 px-3 py-2 outline-none focus:border-sky-500/60"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Account path</label>
          <select
            className="w-full rounded-lg bg-bridge-950 border border-white/10 px-3 py-2 outline-none focus:border-sky-500/60"
            value={form.accountType}
            onChange={(e) => setForm((f) => ({ ...f, accountType: e.target.value }))}
          >
            <option value="investor">Investor</option>
            <option value="founder_candidate">Founder (register company after KYC)</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-bridge-950 font-semibold disabled:opacity-50"
        >
          {busy ? 'Creating…' : 'Create account'}
        </button>
        <p className="text-sm text-slate-500 text-center">
          Already registered?{' '}
          <Link className="text-sky-400 hover:underline" to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
