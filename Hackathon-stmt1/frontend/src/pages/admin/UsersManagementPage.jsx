import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Search, UserX } from 'lucide-react'
import Card from '../../components/ui/Card.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import StatusPill from '../../components/ui/StatusPill.jsx'
import { api } from '../../services/api.js'

export default function UsersManagementPage() {
  const [users, setUsers] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        const { data } = await api.get('/api/admin/users')
        if (isMounted) setUsers(data.users || [])
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return users
    return users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(query))
  }, [users, q])

  async function toggle(user) {
    setBusyId(user._id)
    try {
      const url = user.isSuspended ? `/api/admin/activate/${user._id}` : `/api/admin/suspend/${user._id}`
      const { data } = await api.put(url)
      setUsers((prev) => prev.map((u) => (u._id === data.user._id ? data.user : u)))
      toast.success(user.isSuspended ? 'User activated' : 'User suspended')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs text-white/60">Users</div>
            <div className="mt-1 text-2xl font-semibold">User management</div>
            <p className="mt-2 text-sm text-white/70">Search users and suspend/activate accounts.</p>
          </div>
          <div className="w-full sm:max-w-sm">
            <Input
              label="Search"
              placeholder="Search by name or email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              inputClassName="pl-11"
            />
            <div className="pointer-events-none relative -mt-[42px] ml-4 h-0">
              <Search className="h-4 w-4 text-white/45" />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold">All users</div>
        <div className="mt-4 overflow-hidden rounded-3xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Trust</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-white/70" colSpan={4}>
                    Loading…
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((u) => (
                  <tr key={u._id} className="border-t border-white/10">
                    <td className="px-4 py-3">
                      <div className="text-white/90">{u.name}</div>
                      <div className="text-xs text-white/60">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 text-white/80">{u.trustScore ?? 0}</td>
                    <td className="px-4 py-3">
                      {u.isAdmin ? (
                        <StatusPill status="verified" label="Admin" />
                      ) : u.isSuspended ? (
                        <StatusPill status="rejected" label="Suspended" />
                      ) : (
                        <StatusPill status="verified" label="Active" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.isAdmin ? (
                        <span className="text-xs text-white/50">—</span>
                      ) : (
                        <Button
                          size="sm"
                          variant={u.isSuspended ? 'primary' : 'danger'}
                          disabled={busyId === u._id}
                          onClick={() => toggle(u)}
                        >
                          <UserX className="h-4 w-4" />
                          {u.isSuspended ? 'Activate' : 'Suspend'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-white/70" colSpan={4}>
                    No users found.
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

