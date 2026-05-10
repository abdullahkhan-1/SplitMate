import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { X } from 'lucide-react'

// ── BUTTON ────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 select-none cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-base',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' }[size],
        {
          primary:   'bg-brand text-white hover:bg-brand-strong active:scale-[0.98]',
          secondary: 'bg-raised text-text-1 border border-line hover:bg-overlay active:scale-[0.98]',
          ghost:     'text-text-2 hover:text-text-1 hover:bg-raised',
          danger:    'bg-danger-dim text-danger border border-danger/20 hover:bg-danger hover:text-white active:scale-[0.98]',
          success:   'bg-brand-dim text-brand border border-brand/20 hover:bg-brand hover:text-white active:scale-[0.98]',
        }[variant],
        className
      )}
      {...props}
    >
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'

// ── INPUT ─────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  prefix?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-text-2">{label}</label>}
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-text-3 text-sm font-mono">{prefix}</span>}
        <input
          ref={ref}
          className={clsx(
            'w-full rounded-xl border text-sm transition-colors',
            'bg-raised border-line text-text-1 placeholder:text-text-3',
            'focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50',
            error && 'border-danger focus:ring-danger/30 focus:border-danger',
            prefix ? 'pl-8 pr-3 py-2.5' : 'px-3 py-2.5',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-text-3">{hint}</p>}
    </div>
  )
)
Input.displayName = 'Input'

// ── SELECT ────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-text-2">{label}</label>}
      <select
        ref={ref}
        className={clsx(
          'w-full rounded-xl border text-sm px-3 py-2.5 transition-colors',
          'bg-raised border-line text-text-1',
          'focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50',
          error && 'border-danger',
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: '#1C1C1C' }}>{o.label}</option>
        ))}
      </select>
    </div>
  )
)
Select.displayName = 'Select'

// ── CARD ──────────────────────────────────────────────────────
export const Card = ({ children, className, onClick }: {
  children: ReactNode; className?: string; onClick?: () => void
}) => (
  <div
    onClick={onClick}
    className={clsx(
      'bg-surface rounded-2xl border border-line p-5',
      onClick && 'cursor-pointer hover:border-line-strong transition-colors',
      className
    )}
  >
    {children}
  </div>
)

// ── MODAL ─────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; size?: 'sm' | 'md' | 'lg'
}) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className={clsx(
          'bg-surface border border-line rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh]',
          { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-base font-semibold text-text-1">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-3 hover:text-text-1 hover:bg-raised transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ── BADGE ─────────────────────────────────────────────────────
export const Badge = ({ children, variant = 'default' }: {
  children: ReactNode; variant?: 'default' | 'success' | 'danger' | 'warn' | 'info'
}) => (
  <span className={clsx(
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
    {
      default: 'bg-raised text-text-2 border border-line',
      success: 'bg-brand-dim text-brand border border-brand/20',
      danger:  'bg-danger-dim text-danger border border-danger/20',
      warn:    'bg-warn-dim text-warn border border-warn/20',
      info:    'bg-info-dim text-info border border-info/20',
    }[variant]
  )}>
    {children}
  </span>
)

// ── AMOUNT ────────────────────────────────────────────────────
export const Amount = ({ value, size = 'md', colored = false, showSign = false }: {
  value: number; size?: 'sm' | 'md' | 'lg' | 'xl'; colored?: boolean; showSign?: boolean
}) => {
  const pos = value >= 0
  return (
    <span className={clsx(
      'font-mono font-semibold tabular-nums',
      { sm: 'text-sm', md: 'text-base', lg: 'text-xl', xl: 'text-3xl' }[size],
      colored ? (pos ? 'text-brand' : 'text-danger') : 'text-text-1'
    )}>
      {showSign && value > 0 ? '+' : ''}
      Rs {Math.abs(value).toLocaleString('en-PK', { maximumFractionDigits: 0 })}
    </span>
  )
}

// ── AVATAR ────────────────────────────────────────────────────
const COLORS = [
  'bg-purple-900 text-purple-300',
  'bg-blue-900 text-blue-300',
  'bg-green-900 text-green-300',
  'bg-amber-900 text-amber-300',
  'bg-pink-900 text-pink-300',
]

export const Avatar = ({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) => {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const c = COLORS[name.charCodeAt(0) % COLORS.length]
  return (
    <div className={clsx(
      'rounded-full flex items-center justify-center font-semibold flex-shrink-0 text-sm',
      c,
      { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' }[size]
    )}>
      {initials}
    </div>
  )
}

// ── EMPTY STATE ───────────────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }: {
  icon: ReactNode; title: string; description: string; action?: ReactNode
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
    <div className="w-14 h-14 rounded-2xl bg-raised border border-line flex items-center justify-center text-text-3">
      {icon}
    </div>
    <div>
      <p className="font-semibold text-text-1">{title}</p>
      <p className="text-sm text-text-3 mt-0.5">{description}</p>
    </div>
    {action}
  </div>
)

// ── STAT CARD ─────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, icon, accent }: {
  label: string; value: number; sub?: string; icon: ReactNode; accent: string
}) => (
  <Card>
    <div className="flex items-start justify-between mb-4">
      <p className="text-xs font-medium text-text-3 uppercase tracking-widest">{label}</p>
      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', accent)}>
        {icon}
      </div>
    </div>
    <Amount value={value} size="lg" />
    {sub && <p className="text-xs text-text-3 mt-1">{sub}</p>}
  </Card>
)