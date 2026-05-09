import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { X } from 'lucide-react'

// ——————————————————————————————————————————
// BUTTON
// ——————————————————————————————————————————
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center gap-2 font-sans font-medium rounded-xl transition-all duration-150 select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2.5 text-sm',
            lg: 'px-6 py-3 text-base',
          }[size],
          {
            primary: 'bg-ink-900 text-white hover:bg-ink-800 active:scale-[0.98] focus-visible:ring-ink-900 disabled:opacity-40',
            secondary: 'bg-ink-50 text-ink-900 border border-ink-100 hover:bg-ink-100 active:scale-[0.98] disabled:opacity-40',
            ghost: 'text-ink-600 hover:bg-ink-50 hover:text-ink-900 disabled:opacity-40',
            danger: 'bg-danger-light text-danger border border-danger/20 hover:bg-danger hover:text-white active:scale-[0.98] disabled:opacity-40',
          }[variant],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ——————————————————————————————————————————
// INPUT
// ——————————————————————————————————————————
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  prefix?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-ink-800">{label}</label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-ink-400 text-sm font-mono">{prefix}</span>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full rounded-xl border bg-white text-ink-900 text-sm transition-colors',
              'placeholder:text-ink-200',
              'focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-transparent',
              error ? 'border-danger' : 'border-ink-100',
              prefix ? 'pl-8 pr-3 py-2.5' : 'px-3 py-2.5',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-ink-400">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ——————————————————————————————————————————
// SELECT
// ——————————————————————————————————————————
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-ink-800">{label}</label>}
        <select
          ref={ref}
          className={clsx(
            'w-full rounded-xl border bg-white text-ink-900 text-sm px-3 py-2.5 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-transparent',
            error ? 'border-danger' : 'border-ink-100',
            className
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

// ——————————————————————————————————————————
// CARD
// ——————————————————————————————————————————
interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export const Card = ({ children, className, onClick }: CardProps) => (
  <div
    onClick={onClick}
    className={clsx(
      'bg-white rounded-2xl border border-ink-100 p-5',
      onClick && 'cursor-pointer hover:border-ink-200 transition-colors',
      className
    )}
  >
    {children}
  </div>
)

// ——————————————————————————————————————————
// MODAL
// ——————————————————————————————————————————
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export const Modal = ({ open, onClose, title, children, size = 'md' }: ModalProps) => {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={clsx(
          'bg-white rounded-2xl shadow-xl w-full flex flex-col max-h-[90vh]',
          { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
          <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-ink-50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ——————————————————————————————————————————
// BADGE
// ——————————————————————————————————————————
interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'danger' | 'warn' | 'info'
}

export const Badge = ({ children, variant = 'default' }: BadgeProps) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
      {
        default: 'bg-ink-50 text-ink-600',
        success: 'bg-brand-light text-brand-dark',
        danger: 'bg-danger-light text-danger',
        warn: 'bg-warn-light text-amber-800',
        info: 'bg-info-light text-info',
      }[variant]
    )}
  >
    {children}
  </span>
)

// ——————————————————————————————————————————
// AMOUNT DISPLAY
// ——————————————————————————————————————————
interface AmountProps {
  value: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  colored?: boolean
  showSign?: boolean
}

export const Amount = ({ value, size = 'md', colored = false, showSign = false }: AmountProps) => {
  const positive = value >= 0
  return (
    <span
      className={clsx(
        'font-mono font-medium tabular-nums',
        {
          sm: 'text-sm',
          md: 'text-base',
          lg: 'text-xl',
          xl: 'text-3xl',
        }[size],
        colored && (positive ? 'text-brand' : 'text-danger')
      )}
    >
      {showSign && value > 0 ? '+' : ''}
      Rs {Math.abs(value).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
    </span>
  )
}

// ——————————————————————————————————————————
// AVATAR
// ——————————————————————————————————————————
const AVATAR_COLORS = [
  'bg-purple-100 text-purple-700',
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
]

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

export const Avatar = ({ name, size = 'md' }: AvatarProps) => {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const colorIdx = name.charCodeAt(0) % AVATAR_COLORS.length
  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-sans font-semibold flex-shrink-0',
        AVATAR_COLORS[colorIdx],
        { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' }[size]
      )}
    >
      {initials}
    </div>
  )
}

// ——————————————————————————————————————————
// EMPTY STATE
// ——————————————————————————————————————————
interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
    <div className="w-14 h-14 rounded-2xl bg-ink-50 flex items-center justify-center text-ink-200">
      {icon}
    </div>
    <div>
      <p className="font-display font-semibold text-ink-800">{title}</p>
      <p className="text-sm text-ink-400 mt-0.5">{description}</p>
    </div>
    {action}
  </div>
)