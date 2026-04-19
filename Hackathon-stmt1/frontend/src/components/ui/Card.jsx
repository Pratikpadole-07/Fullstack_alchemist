function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Card({ className, children }) {
  return <div className={cx('glass-card p-5 sm:p-6', className)}>{children}</div>
}

