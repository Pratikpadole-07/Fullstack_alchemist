import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ShieldCheck } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function validate({ name, email, password, phone }) {
  const errors = {}
  if (!name || name.trim().length < 2) errors.name = 'Enter your name'
  if (!email || !email.includes('@')) errors.email = 'Enter a valid email'
  if (!password || password.length < 6) errors.password = 'Password must be at least 6 characters'
  if (phone && phone.replace(/[^\d]/g, '').length < 10) errors.phone = 'Enter a valid phone or leave blank'
  return errors
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)
  const errors = useMemo(() => validate(form), [form])

  async function onSubmit(e) {
    e.preventDefault()
    const current = validate(form)
    if (Object.keys(current).length) {
      toast.error('Fix the highlighted fields')
      return
    }
    setSubmitting(true)
    try {
      await register(form)
      navigate('/app')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-full">
      <div className="mx-auto flex min-h-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mx-auto mb-6 flex items-center justify-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-500/80 to-purple-500/80 shadow-soft">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-sm font-semibold">Identity Trust</div>
          </Link>

          <Card className="p-6 sm:p-7">
            <div className="text-xl font-semibold">Create your account</div>
            <p className="mt-1 text-sm text-white/70">Start verifying in minutes and build a trust score.</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <Input
                label="Name"
                placeholder="Jane Doe"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                error={errors.name}
                autoComplete="name"
              />
              <Input
                label="Email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                error={errors.email}
                autoComplete="email"
              />
              <Input
                label="Password"
                placeholder="••••••••"
                type="password"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                error={errors.password}
                autoComplete="new-password"
              />
              <Input
                label="Phone (optional)"
                placeholder="+1 555 0100"
                value={form.phone}
                onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                error={errors.phone}
                autoComplete="tel"
              />

              <Button disabled={submitting} className="w-full" size="lg" type="submit">
                {submitting ? 'Creating…' : 'Create account'}
              </Button>
            </form>

            <div className="mt-5 text-center text-sm text-white/70">
              Already have an account?{' '}
              <Link className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white/70" to="/login">
                Sign in
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

