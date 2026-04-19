import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, BadgeCheck, FileCheck2, Shield } from 'lucide-react'
import Card from '../../components/ui/Card.jsx'
import ProgressRing from '../../components/ui/ProgressRing.jsx'
import StatusPill from '../../components/ui/StatusPill.jsx'
import Button from '../../components/ui/Button.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTrustScore } from '../../hooks/useTrustScore.js'
import { api } from '../../services/api.js'

function mapStatus(verification) {
  if (!verification) return 'missing'
  if (verification.status === 'approved') return 'verified'
  if (verification.status === 'rejected') return 'rejected'
  return 'pending'
}

export default function DashboardHomePage() {
  const { user, setUser } = useAuth()
  const { score } = useTrustScore(user?._id)
  const [verification, setVerification] = useState(null)
  const [activity, setActivity] = useState([])

  const trust = score?.total ?? user?.trustScore ?? 0

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        const [{ data: v }, { data: p }] = await Promise.all([
          api.get('/api/verify/my'),
          api.get('/api/users/profile'),
        ])
        if (!isMounted) return
        setVerification(v.verification || null)
        setUser(p.user)
        setActivity([
          { label: 'Profile synced', ts: new Date().toISOString() },
          ...(v.verification?.updatedAt
            ? [{ label: `Verification ${v.verification.status}`, ts: v.verification.updatedAt }]
            : []),
          ...(p.user?.isEmailVerified ? [{ label: 'Email verified', ts: p.user.updatedAt }] : []),
        ])
      } catch {
        // ignore
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [setUser])

  const badge = useMemo(() => {
    if (trust >= 80) return { label: 'Trusted', tone: 'verified' }
    if (trust >= 50) return { label: 'Verified', tone: 'pending' }
    return { label: 'Unverified', tone: 'missing' }
  }, [trust])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs text-white/60">Dashboard</div>
              <div className="mt-1 text-2xl font-semibold">Welcome, {user?.name || '—'}</div>
              <p className="mt-2 text-sm text-white/70">
                Complete verification steps to increase your trust score and unlock premium badge status.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusPill status={badge.tone} label={badge.label} />
                <StatusPill status={user?.isEmailVerified ? 'verified' : 'missing'} label="Email OTP" />
                <StatusPill status={user?.isPhoneVerified ? 'verified' : 'missing'} label="Phone OTP" />
                <StatusPill status={mapStatus(verification)} label="ID Review" />
              </div>
            </div>

            <div className="flex items-center gap-5 rounded-3xl border border-white/10 bg-white/5 p-4">
              <ProgressRing value={trust} />
              <div>
                <div className="text-xs text-white/60">Next best action</div>
                <div className="mt-1 text-sm font-semibold">Finish verification</div>
                <div className="mt-3">
                  <Link to="/app/verification">
                    <Button size="sm">
                      Continue <FileCheck2 className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold">Verification status</div>
              <div className="mt-1 text-sm text-white/70">A snapshot of your current trust checks.</div>
            </div>
            <Shield className="h-5 w-5 text-white/70" />
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-sm">Email OTP</div>
              <StatusPill status={user?.isEmailVerified ? 'verified' : 'missing'} label={user?.isEmailVerified ? 'Verified' : 'Not verified'} />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-sm">Phone OTP</div>
              <StatusPill status={user?.isPhoneVerified ? 'verified' : 'missing'} label={user?.isPhoneVerified ? 'Verified' : 'Not verified'} />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-sm">Identity documents</div>
              <StatusPill status={mapStatus(verification)} label={verification?.status ? verification.status : 'Not submitted'} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold">Recent activity</div>
              <div className="mt-1 text-sm text-white/70">Updates from your verification workflow.</div>
            </div>
            <Activity className="h-5 w-5 text-white/70" />
          </div>
          <div className="mt-5 space-y-3">
            {activity.length ? (
              activity.slice(0, 6).map((a, idx) => (
                <div key={`${a.label}-${idx}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-sm">{a.label}</div>
                  <div className="text-xs text-white/55">{new Date(a.ts).toLocaleString()}</div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
                No recent activity yet.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold">Badge status</div>
              <div className="mt-1 text-sm text-white/70">Your score unlocks a trust badge.</div>
            </div>
            <BadgeCheck className="h-5 w-5 text-white/70" />
          </div>
          <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-white/60">Current badge</div>
                <div className="mt-1 text-xl font-semibold">{badge.label}</div>
              </div>
              <StatusPill status={badge.tone} label={`${trust}/100`} />
            </div>
            <div className="mt-4 text-sm text-white/70">
              Reach 50+ for <span className="text-white">Verified</span> and 80+ for <span className="text-white">Trusted</span>.
            </div>
            <div className="mt-5">
              <Link to="/app/verification">
                <Button variant="ghost" className="w-full">
                  Improve trust score
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

