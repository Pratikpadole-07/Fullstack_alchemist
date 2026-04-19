import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition ${
    isActive ? 'bg-bridge-800 text-white' : 'text-slate-400 hover:text-white'
  }`;

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 bg-bridge-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-400 to-emerald-400 shadow-lg shadow-sky-500/20" />
            <div>
              <div className="text-lg font-semibold tracking-tight">TrustBridge</div>
              <div className="text-xs text-slate-500">Verified founders · Verified investors</div>
            </div>
          </Link>
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/company" className={linkClass}>
                Company
              </NavLink>
              <NavLink to="/messages" className={linkClass}>
                Messages
              </NavLink>
            </nav>
          )}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-slate-200">{user.email}</div>
                  <div className="text-xs text-slate-500 capitalize">
                    {user.accountType?.replace('_', ' ')} · KYC: {user.kycStatus}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="text-sm px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="text-sm px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="text-sm px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-bridge-950 font-semibold"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
