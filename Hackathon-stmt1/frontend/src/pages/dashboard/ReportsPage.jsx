import { useEffect, useState } from 'react'
import { Flag } from 'lucide-react'
import Card from '../../components/ui/Card.jsx'
import StatusPill from '../../components/ui/StatusPill.jsx'
import { api } from '../../services/api.js'

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        const { data } = await api.get('/api/reports/against-me')
        if (isMounted) setReports(data.reports || [])
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-white/60">Reports</div>
            <div className="mt-1 text-2xl font-semibold">Reports against your profile</div>
            <p className="mt-2 text-sm text-white/70">Admins use reports as a risk signal to triage accounts.</p>
          </div>
          <Flag className="h-5 w-5 text-white/70" />
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold">Submitted reports</div>
        <div className="mt-4 overflow-hidden rounded-3xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-white/70" colSpan={3}>
                    Loading…
                  </td>
                </tr>
              ) : reports.length ? (
                reports.map((r) => (
                  <tr key={r._id} className="border-t border-white/10 bg-white/0">
                    <td className="px-4 py-3 text-white/85">{r.reason}</td>
                    <td className="px-4 py-3">
                      <StatusPill
                        status={r.status === 'open' ? 'flagged' : r.status === 'resolved' ? 'verified' : 'pending'}
                        label={r.status}
                      />
                    </td>
                    <td className="px-4 py-3 text-white/60">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-white/70" colSpan={3}>
                    No reports found.
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

