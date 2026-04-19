import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Gavel, LayoutDashboard, ShieldAlert, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

function AdminLink({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/admin'}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition',
          isActive
            ? 'bg-white/15 text-white shadow-soft border border-white/10'
            : 'text-white/70 hover:text-white hover:bg-white/10',
        ].join(' ')
      }
    >
      <Icon className="h-4 w-4" />
      <span className="font-medium">{label}</span>
    </NavLink>
  )
}

export default function AdminShell() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="glass-card p-4 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
            <button
              onClick={() => navigate('/admin')}
              className="flex w-full items-center gap-2 rounded-2xl px-2 py-2 hover:bg-white/10"
            >
              <div className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-purple-500/70 to-blue-500/70 shadow-soft">
                <Gavel className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold leading-tight">Admin Console</div>
                <div className="text-xs text-white/60">{user?.email || '—'}</div>
              </div>
            </button>

            <div className="mt-3 space-y-1">
              <AdminLink to="/admin" icon={LayoutDashboard} label="Overview" />
              <AdminLink to="/admin/users" icon={Users} label="Users" />
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <button
                onClick={() => navigate('/app')}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/15"
              >
                <ShieldAlert className="h-4 w-4" />
                Back to App
              </button>
            </div>
          </aside>

          <main className="min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  )
}

