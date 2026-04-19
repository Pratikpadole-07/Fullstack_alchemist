import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Dashboard</p>
            <p className="font-semibold text-white">{user?.name}</p>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/verify"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Company verification
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white">Welcome</h2>
          <p className="mt-2 max-w-xl text-slate-400">
            Verify that you own a company by checking MCA CIN data, GST records, director name match, and control of a
            domain email aligned with your company.
          </p>
          <Link
            to="/verify"
            className="mt-6 inline-flex rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Start verification →
          </Link>
        </div>
      </main>
    </div>
  );
}
