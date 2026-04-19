import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Check, X } from 'lucide-react'
import Card from '../../components/ui/Card.jsx'
import Button from '../../components/ui/Button.jsx'
import StatusPill from '../../components/ui/StatusPill.jsx'
import { api } from '../../services/api.js'

function assetUrl(path) {
  if (!path) return null
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  return `${base}${path}`
}

export default function VerificationReviewPage() {
  const { verificationId } = useParams()
  const navigate = useNavigate()
  const [verification, setVerification] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        const { data } = await api.get(`/api/admin/verification/${verificationId}`)
        if (!isMounted) return
        setVerification(data.verification)
        setNotes(data.verification?.reviewNotes || '')
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load verification')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [verificationId])

  async function act(action) {
    setSubmitting(true)
    try {
      const url = action === 'approve' ? `/api/admin/approve/${verificationId}` : `/api/admin/reject/${verificationId}`
      const { data } = await api.put(url, { reviewNotes: notes })
      setVerification(data.verification)
      toast.success(`Verification ${action}d`)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="text-sm text-white/70">Loading…</div>
      </Card>
    )
  }

  if (!verification) {
    return (
      <Card>
        <div className="text-sm text-white/70">Verification not found.</div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs text-white/60">Review</div>
            <div className="mt-1 text-2xl font-semibold">Verification request</div>
            <div className="mt-2 text-sm text-white/70">
              {verification.userId?.name} · <span className="text-white/80">{verification.userId?.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill
              status={
                verification.status === 'approved'
                  ? 'verified'
                  : verification.status === 'rejected'
                    ? 'rejected'
                    : 'pending'
              }
              label={verification.status}
            />
            <Button variant="subtle" onClick={() => navigate('/admin')}>
              Back
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="text-sm font-semibold">ID Document</div>
          <div className="mt-4 h-80 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            {verification.idDocument ? (
              <img src={assetUrl(verification.idDocument)} alt="ID document" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-sm text-white/60">Not submitted</div>
            )}
          </div>
        </Card>

        <Card>
          <div className="text-sm font-semibold">Selfie</div>
          <div className="mt-4 h-80 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            {verification.selfieImage ? (
              <img src={assetUrl(verification.selfieImage)} alt="Selfie" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-sm text-white/60">Not submitted</div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="text-sm font-semibold">Professional & social details</div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">Company email</div>
            <div className="mt-1 text-sm text-white/85">{verification.companyEmail || '—'}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">Website</div>
            <div className="mt-1 text-sm text-white/85">{verification.website || '—'}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">LinkedIn</div>
            <div className="mt-1 text-sm text-white/85">{verification.linkedin || '—'}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">Socials</div>
            <div className="mt-1 text-sm text-white/85">
              {verification.socials?.twitter || verification.socials?.instagram || verification.socials?.linkedin ? 'Provided' : '—'}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
          <label className="block">
            <div className="mb-1.5 text-sm font-medium text-white/85">Review notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/45 shadow-glass outline-none transition focus:border-blue-400/40 focus:ring-2 focus:ring-blue-400/30"
              placeholder="Add reviewer notes for auditing…"
            />
          </label>

          <div className="flex flex-col gap-2 lg:items-end">
            <Button disabled={submitting} onClick={() => act('approve')}>
              <Check className="h-4 w-4" />
              Approve
            </Button>
            <Button disabled={submitting} variant="danger" onClick={() => act('reject')}>
              <X className="h-4 w-4" />
              Reject
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

