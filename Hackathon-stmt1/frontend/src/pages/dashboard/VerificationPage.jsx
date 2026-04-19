import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  CheckCircle2,
  FileUp,
  Fingerprint,
  Mail,
  Phone,
  Upload,
  UserCheck
} from 'lucide-react'

import Card from '../../components/ui/Card.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import StatusPill from '../../components/ui/StatusPill.jsx'
import { api } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import LivenessCheck from "../../components/ui/LivenessCheck.jsx";

function filePreview(file) {
  if (!file) return null
  return URL.createObjectURL(file)
}

function StepRow({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="flex flex-col justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-white/10">
          <Icon className="h-5 w-5 text-white/80" />
        </div>

        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-sm text-white/70">{subtitle}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">{right}</div>
    </div>
  )
}

export default function VerificationPage() {
  const { user, setUser } = useAuth()

  const [verification, setVerification] = useState(null)
  const [loading, setLoading] = useState(true)

  const [emailOtp, setEmailOtp] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [phoneSent, setPhoneSent] = useState(false)


  const [showLiveness, setShowLiveness] = useState(false);
  const [selfieVerified, setSelfieVerified] = useState(false);


  const idRef = useRef(null)
  const selfieRef = useRef(null)

  const [idFile, setIdFile] = useState(null)
  const [selfieFile, setSelfieFile] = useState(null)

  const [companyEmail, setCompanyEmail] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [website, setWebsite] = useState('')
  const [instagram, setInstagram] = useState('')

  const idPreview = useMemo(() => filePreview(idFile), [idFile])
  const selfiePreview = useMemo(() => filePreview(selfieFile), [selfieFile])

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const [{ data: v }, { data: p }] = await Promise.all([
          api.get('/api/verify/my'),
          api.get('/api/users/profile')
        ])

        if (!isMounted) return

        setVerification(v.verification || null)
        setUser(p.user)

        setCompanyEmail(v.verification?.companyEmail || '')
        setLinkedin(v.verification?.linkedin || '')
        setWebsite(v.verification?.website || '')
        setInstagram(v.verification?.socials?.instagram || '')
      } catch {
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [setUser])

  async function sendEmailOtp() {
    try {
      await api.post('/api/verify/email', { action: 'send' })
      setEmailSent(true)
      toast.success('Email OTP sent')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed')
    }
  }

  async function verifyEmailOtp() {
    try {
      const { data } = await api.post('/api/verify/email', {
        action: 'verify',
        code: emailOtp
      })

      setUser(data.user)
      toast.success('Email verified')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid OTP')
    }
  }

  async function sendPhoneOtp() {
    try {
      await api.post('/api/verify/phone', { action: 'send' })
      setPhoneSent(true)
      toast.success('Phone OTP sent')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed')
    }
  }

  async function verifyPhoneOtp() {
    try {
      const { data } = await api.post('/api/verify/phone', {
        action: 'verify',
        code: phoneOtp
      })

      setUser(data.user)
      toast.success('Phone verified')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid OTP')
    }
  }

  async function uploadId() {
  if (!idFile) return toast.error('Choose ID first')

  try {
    const fd = new FormData()
    fd.append('idDocument', idFile)

    const { data } = await api.post('/api/verify/id-upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    setVerification(data.verification)

    const profile = await api.get('/api/users/profile')
    setUser(profile.data.user)

    toast.success('Government ID processed successfully')
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Upload failed')
  }
}

  async function uploadSelfie() {
    if (!selfieFile) return toast.error('Choose selfie first')

    try {
      const fd = new FormData()
      fd.append('selfieImage', selfieFile)

      const { data } = await api.post('/api/verify/selfie-upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setVerification(data.verification)
      toast.success('Selfie uploaded')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed')
    }
  }

  async function saveProfessional() {
    try {
      const { data } = await api.post('/api/verify/professional', {
        companyEmail,
        linkedin,
        website,
        socials: { instagram }
      })

      setVerification(data.verification)
      toast.success('Saved')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed')
    }
  }

  function githubLogin() {
    if (!user?._id) return toast.error("Login first");

    window.location.href =
    `http://localhost:5000/api/oauth/github?userId=${user._id}`;
  }

  function twitterLogin() {
    window.location.href =
    `http://localhost:5000/api/oauth/twitter?userId=${user._id}`;
  }

  const reviewStatus = verification?.status || 'not-submitted'

  if (loading) {
    return <div className="text-white">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs text-white/60">Verification</div>
            <div className="mt-1 text-2xl font-semibold">
              Build trust with multi-step checks
            </div>
          </div>

          <StatusPill
            status={
              reviewStatus === 'approved'
                ? 'verified'
                : reviewStatus === 'rejected'
                ? 'rejected'
                : reviewStatus === 'pending'
                ? 'pending'
                : 'missing'
            }
            label={
              reviewStatus === 'not-submitted'
                ? 'Not submitted'
                : `Review: ${reviewStatus}`
            }
          />
        </div>
      </Card>

      <Card>
        <div className="text-lg font-semibold">A. Basic Verification</div>
        <div className="mt-5 space-y-3">
          <StepRow
            icon={Mail}
            title="Email OTP"
            subtitle="Verify your email"
            right={
              user?.isEmailVerified ? (
                <StatusPill status="verified" label="Verified" />
              ) : (
                <div className="flex gap-2">
                  <Button onClick={sendEmailOtp}>Send OTP</Button>
                  <input
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    placeholder="123456"
                    className="w-28 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm"
                  />
                  <Button onClick={verifyEmailOtp}>Verify</Button>
                </div>
              )
            }
          />

          <StepRow
            icon={Phone}
            title="Phone OTP"
            subtitle="Verify your phone"
            right={
              user?.isPhoneVerified ? (
                <StatusPill status="verified" label="Verified" />
              ) : (
                <div className="flex gap-2">
                  <Button onClick={sendPhoneOtp}>Send OTP</Button>
                  <input
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    placeholder="123456"
                    className="w-28 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm"
                  />
                  <Button onClick={verifyPhoneOtp}>Verify</Button>
                </div>
              )
            }
          />
        </div>
      </Card>

      <Card>
        <div className="text-lg font-semibold">B. Social Identity Verification</div>
        <div className="mt-1 text-sm text-white/70">
          Connect real public accounts for trust scoring.
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">GitHub</div>
                <div className="text-sm text-white/60">
                  Verify developer identity
                </div>
              </div>

        
            </div>

            <div className="mt-5">
              {user?.verification?.githubConnected ? (
              <StatusPill status="verified" label="Connected" />
              ) : (
              <Button onClick={githubLogin}>
                Connect GitHub
              </Button>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">X / Twitter</div>
                <div className="text-sm text-white/60">
                  Verify social presence
                </div>
              </div>

              
            </div>

            <div className="mt-5">
              {user?.verification?.twitterConnected ? (
                <StatusPill status="verified" label="Connected" />
              ) : (
                <Button onClick={twitterLogin}>
                  Connect X
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-lg font-semibold">C. Identity Verification</div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="font-semibold">Government ID</div>

            <div className="mt-4 h-44 overflow-hidden rounded-3xl border border-white/10">
              {idPreview ? (
                <img
                  src={idPreview}
                  alt="id"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-sm text-white/60">
                  No file selected
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={() => idRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Choose
              </Button>

              
              <Button onClick={uploadId}>
                <FileUp className="h-4 w-4" />
                Upload
              </Button>
            </div>
              {verification?.govtFullName && (
  <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm space-y-2">
    <div>
      <strong>Name:</strong> {verification.govtFullName}
    </div>

    <div>
      <strong>DOB:</strong>{" "}
      {verification.govtDob || "Not found"}
    </div>

    <div>
      <strong>ID:</strong>{" "}
      {verification.maskedIdNumber || "Masked"}
    </div>

    <div>
      <strong>Match Score:</strong>{" "}
      {verification.nameMatchScore}%
    </div>

    <div>
      <strong>Status:</strong>{" "}
      {verification.nameVerified
        ? "Verified"
        : verification.reviewFlag
        ? "Needs Review"
        : "Pending"}
    </div>
  </div>
)}
            <input
              ref={idRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setIdFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
  <div className="font-semibold">Selfie Verification</div>

  <div className="mt-4 rounded-3xl border border-white/10 p-3">
    {!selfieVerified && !showLiveness && (
      <div className="text-center">
        <div className="mb-4 text-sm text-white/60">
          Verify identity using live camera check
        </div>

        <Button onClick={() => setShowLiveness(true)}>
          Start Verification
        </Button>
      </div>
    )}

    {showLiveness && (
      <LivenessCheck
        onSuccess={() => {
          setSelfieVerified(true);
          setShowLiveness(false);
        }}
      />
    )}

    {selfieVerified && (
      <div className="text-center py-6">
        <div className="text-green-400 font-semibold">
          Selfie Verified Successfully
        </div>
      </div>
    )}
  </div>
</div>
        </div>
      </Card>

      <Card>
        <div className="text-lg font-semibold">D. Professional Verification</div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Input
            label="Company Email"
            value={companyEmail}
            onChange={(e) => setCompanyEmail(e.target.value)}
          />

          <Input
            label="Website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />

          <Input
            label="LinkedIn URL"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
          />

          <Input
            label="Instagram"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={saveProfessional}>Save</Button>
        </div>
      </Card>
    </div>
  )
}