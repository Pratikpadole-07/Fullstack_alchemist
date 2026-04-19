import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ShieldCheck } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function validate({ email, password }) {
  const errors = {}
  if (!email || !email.includes('@')) errors.email = 'Enter a valid email'
  if (!password || password.length < 6) errors.password = 'Password must be at least 6 characters'
  return errors
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
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
      await login(form)
      navigate('/app')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed')
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
            <div className="text-xl font-semibold">Sign in</div>
            <p className="mt-1 text-sm text-white/70">Access your dashboard and verification progress.</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
                autoComplete="current-password"
              />

              <Button disabled={submitting} className="w-full" size="lg" type="submit">
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-5 text-center text-sm text-white/70">
              New here?{' '}
              <Link className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white/70" to="/register">
                Create an account
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

