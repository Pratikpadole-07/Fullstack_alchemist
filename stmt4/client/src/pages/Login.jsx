import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Sign in</h1>
      <p className="text-slate-400 text-sm mb-6">
        Access your TrustBridge workspace with JWT-secured sessions.
      </p>
      <form onSubmit={onSubmit} className="space-y-4 bg-bridge-900/60 border border-white/10 rounded-2xl p-6">
        {error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Email</label>
          <input
            className="w-full rounded-lg bg-bridge-950 border border-white/10 px-3 py-2 outline-none focus:border-sky-500/60"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Password</label>
          <input
            className="w-full rounded-lg bg-bridge-950 border border-white/10 px-3 py-2 outline-none focus:border-sky-500/60"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-bridge-950 font-semibold disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="text-sm text-slate-500 text-center">
          No account?{' '}
          <Link className="text-sky-400 hover:underline" to="/register">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
