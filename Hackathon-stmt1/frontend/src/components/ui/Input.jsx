import { forwardRef } from 'react'

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

const Input = forwardRef(function Input(
  { label, hint, error, className, inputClassName, ...props },
  ref
) {
  return (
    <label className={cx('block', className)}>
      {label ? <div className="mb-1.5 text-sm font-medium text-white/85">{label}</div> : null}
      <input
        ref={ref}
        className={cx(
          'w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/45 shadow-glass outline-none transition focus:border-blue-400/40 focus:ring-2 focus:ring-blue-400/30',
          error ? 'border-red-400/40 focus:border-red-400/50 focus:ring-red-400/25' : null,
          inputClassName
        )}
        {...props}
      />
      {error ? (
        <div className="mt-1.5 text-xs text-red-200/90">{error}</div>
      ) : hint ? (
        <div className="mt-1.5 text-xs text-white/55">{hint}</div>
      ) : null}
    </label>
  )
})

export default Input

