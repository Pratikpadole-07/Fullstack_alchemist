import { forwardRef } from 'react'

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

const Button = forwardRef(function Button(
  { as: Comp = 'button', variant = 'primary', size = 'md', className, ...props },
  ref
) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:opacity-60 disabled:pointer-events-none'

  const variants = {
    primary: 'bg-gradient-to-br from-blue-500/90 to-purple-500/90 text-white shadow-soft hover:from-blue-500 hover:to-purple-500',
    ghost: 'bg-white/10 text-white/85 hover:bg-white/15 border border-white/15',
    subtle: 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/10',
    danger: 'bg-red-500/85 hover:bg-red-500 text-white shadow-soft',
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  }

  return (
    <Comp
      ref={ref}
      className={cx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
})

export default Button

