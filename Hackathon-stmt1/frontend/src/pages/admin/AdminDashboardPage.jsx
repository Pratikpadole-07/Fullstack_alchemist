import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, BadgeCheck, FileSearch, Users } from 'lucide-react'
import Card from '../../components/ui/Card.jsx'
import StatusPill from '../../components/ui/StatusPill.jsx'
import Button from '../../components/ui/Button.jsx'
import { api } from '../../services/api.js'

export default function AdminDashboardPage() {
  const [pending, setPending] = useState([])
  const [users, setUsers] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        const [p, u, r] = await Promise.all([
          api.get('/api/admin/pending'),
          api.get('/api/admin/users'),
          api.get('/api/admin/reports'),
        ])
        if (!isMounted) return
        setPending(p.data.verifications || [])
        setUsers(u.data.users || [])
        setReports(r.data.reports || [])
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  const metrics = useMemo(() => {
    const totalUsers = users.length
    const pendingVerifications = pending.length
    const highRisk = users.filter((x) => (x.trustScore ?? 0) < 30 && !x.isAdmin).length
    const fakeReports = reports.filter((x) => x.status === 'open').length
    return { totalUsers, pendingVerifications, highRisk, fakeReports }
  }, [pending, users, reports])

  return (
    <div className="space-y-6">
      <Card>
        <div className="text-xs text-white/60">Admin</div>
        <div className="mt-1 text-2xl font-semibold">Verification operations</div>
        <p className="mt-2 text-sm text-white/70">Review pending submissions, triage risk, and manage users.</p>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total users', value: metrics.totalUsers, icon: Users },
          { label: 'Pending verifications', value: metrics.pendingVerifications, icon: FileSearch },
          { label: 'High risk accounts', value: metrics.highRisk, icon: AlertTriangle },
          { label: 'Fake profile reports', value: metrics.fakeReports, icon: BadgeCheck },
        ].map((m) => (
          <Card key={m.label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-white/60">{m.label}</div>
                <div className="mt-2 text-2xl font-semibold">{loading ? '—' : m.value}</div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-white/10">
                <m.icon className="h-5 w-5 text-white/75" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Pending verification requests</div>
            <div className="mt-1 text-sm text-white/70">Open requests waiting for admin review.</div>
          </div>
          <Link to="/admin/users">
            <Button variant="ghost" size="sm">
              Manage users
            </Button>
          </Link>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-white/70" colSpan={4}>
                    Loading…
                  </td>
                </tr>
              ) : pending.length ? (
                pending.slice(0, 8).map((v) => (
                  <tr key={v._id} className="border-t border-white/10">
                    <td className="px-4 py-3">
                      <div className="text-white/90">{v.userId?.name || '—'}</div>
                      <div className="text-xs text-white/60">{v.userId?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-white/70">{v.companyEmail || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusPill status="pending" label="pending" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/review/${v._id}`}>
                        <Button size="sm">Review</Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-white/70" colSpan={4}>
                    No pending verification requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

