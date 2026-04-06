import clsx from 'clsx'
import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

// ── Button ────────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  loading,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-accent-500 hover:bg-accent-600 text-parchment-50 px-6 py-3 shadow-md hover:shadow-lg',
    ghost:   'border border-ink-200 hover:border-ink-400 text-ink-700 px-5 py-2.5 hover:bg-ink-50',
    danger:  'bg-red-500 hover:bg-red-600 text-white px-5 py-2.5',
  }
  return (
    <button
      className={clsx(base, variants[variant], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium',
        'bg-parchment-100 text-ink-600 border border-parchment-300',
        className
      )}
    >
      {children}
    </span>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────

export function Spinner({ size = 24 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-accent-500" />
}

// ── ErrorBox ──────────────────────────────────────────────────────────────────

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  )
}

// ── ProgressBar ───────────────────────────────────────────────────────────────

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div className="w-full h-1.5 bg-parchment-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-accent-500 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  body,
}: {
  icon: ReactNode
  title: string
  body: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-parchment-100 flex items-center justify-center text-ink-300">
        {icon}
      </div>
      <div>
        <p className="font-display text-xl text-ink-700">{title}</p>
        <p className="mt-1 text-sm text-ink-400">{body}</p>
      </div>
    </div>
  )
}
