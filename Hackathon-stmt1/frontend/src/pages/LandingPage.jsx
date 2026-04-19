import { motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, Lock, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'

const features = [
  {
    icon: ShieldCheck,
    title: 'Multi-layer verification',
    desc: 'OTP, ID upload, selfie, professional and social checks—unified into a single flow.',
  },
  {
    icon: BadgeCheck,
    title: 'Trust scoring',
    desc: 'A transparent score out of 100 that updates as users complete verification steps.',
  },
  {
    icon: Lock,
    title: 'Admin review',
    desc: 'Approve or reject submissions, manage users, and triage high-risk accounts.',
  },
]

function SectionTitle({ kicker, title, subtitle }) {
  return (
    <div className="text-center">
      {kicker ? (
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70">
          <Sparkles className="h-3.5 w-3.5 text-blue-200/90" />
          {kicker}
        </div>
      ) : null}
      <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mx-auto mt-3 max-w-2xl text-sm text-white/70 sm:text-base">{subtitle}</p> : null}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-full">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-500/80 to-purple-500/80 shadow-soft">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Identity Verification</div>
            <div className="text-xs text-white/60">Trust Platform</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 sm:flex">
          <a className="rounded-xl px-3 py-2 text-sm text-white/70 hover:text-white" href="#features">
            Features
          </a>
          <a className="rounded-xl px-3 py-2 text-sm text-white/70 hover:text-white" href="#how">
            How it works
          </a>
          <a className="rounded-xl px-3 py-2 text-sm text-white/70 hover:text-white" href="#pricing">
            Pricing
          </a>
          <Link to="/login">
            <Button variant="subtle" size="sm">
              Sign in
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8 lg:pt-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70">
                <Sparkles className="h-3.5 w-3.5 text-purple-200/90" />
                Verify Identity. Build Trust.
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Identity Verification &amp; Trust Platform
              </h1>
              <p className="mt-4 max-w-xl text-base text-white/70">
                Turn verification into a premium experience. Reduce fraud, improve credibility, and give your users a
                trust score that evolves over time.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                    Sign in
                  </Button>
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/55">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">JWT protected</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">File uploads</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Admin review</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Trust score</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}>
              <div className="glass-card p-6">
                <div className="text-sm font-semibold">Live trust overview</div>
                <p className="mt-1 text-sm text-white/70">
                  A premium dashboard that highlights verification progress and risk signals.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Email OTP', value: 'Verified', color: 'from-emerald-400/60 to-emerald-300/20' },
                    { label: 'Phone OTP', value: 'Verified', color: 'from-emerald-400/60 to-emerald-300/20' },
                    { label: 'Government ID', value: 'Pending', color: 'from-amber-400/60 to-amber-300/20' },
                    { label: 'Selfie match', value: 'Pending', color: 'from-amber-400/60 to-amber-300/20' },
                  ].map((x) => (
                    <div key={x.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs text-white/60">{x.label}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${x.color}`} />
                        <div className="text-sm font-medium">{x.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-white/60">Trust Score</div>
                    <div className="text-xs text-white/60">out of 100</div>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-blue-500/80 to-purple-500/80" />
                  </div>
                  <div className="mt-2 text-sm font-semibold">62</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <SectionTitle
            kicker="Product"
            title="Trust checks that feel effortless"
            subtitle="Build a verification experience your users actually want to complete—with realtime progress and clean admin workflows."
          />
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="p-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 border border-white/15">
                    <f.icon className="h-5 w-5 text-white/85" />
                  </div>
                  <div className="text-sm font-semibold">{f.title}</div>
                </div>
                <p className="mt-3 text-sm text-white/70">{f.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <SectionTitle
            kicker="Workflow"
            title="How it works"
            subtitle="A simple end-to-end pipeline: onboarding → verification → scoring → admin review."
          />

          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[
              { step: '01', title: 'Create a profile', desc: 'Add your role, bio, and profile photo for a clean baseline.' },
              { step: '02', title: 'Complete verification', desc: 'Email/phone OTP, upload ID + selfie, and add professional/social links.' },
              { step: '03', title: 'Build trust over time', desc: 'Your score updates instantly and admin reviews flagged submissions.' },
            ].map((s) => (
              <Card key={s.step} className="p-6">
                <div className="text-xs text-white/55">Step {s.step}</div>
                <div className="mt-2 text-lg font-semibold">{s.title}</div>
                <p className="mt-2 text-sm text-white/70">{s.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <SectionTitle kicker="Pricing" title="Launch-ready plans" subtitle="Pricing placeholders for hackathon scope (wire it to Stripe later)." />
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { name: 'Starter', price: '$0', note: 'For demos and pilots' },
              { name: 'Growth', price: '$49', note: 'Teams and communities' },
              { name: 'Enterprise', price: 'Custom', note: 'Compliance + SLAs' },
            ].map((p) => (
              <Card key={p.name} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-sm text-white/75">{p.price}/mo</div>
                </div>
                <p className="mt-3 text-sm text-white/70">{p.note}</p>
                <div className="mt-6">
                  <Button variant="ghost" className="w-full">
                    Contact sales
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <footer className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
            <div className="text-sm text-white/60">© {new Date().getFullYear()} Identity Trust Platform</div>
            <div className="text-sm text-white/60">Verify Identity. Build Trust.</div>
          </div>
        </footer>
      </main>
    </div>
  )
}

