import { NavLink, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { LayoutDashboard, Wallet, Receipt, Users, ArrowLeftRight, LogOut, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui'

const NAV = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/wallet',   icon: Wallet,          label: 'Wallet'    },
  { to: '/expenses', icon: Receipt,         label: 'Expenses'  },
  { to: '/debts',    icon: ArrowLeftRight,  label: 'Debts'     },
  { to: '/friends',  icon: Users,           label: 'Friends'   },
]

export const Sidebar = () => {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()

  return (
    <aside className="w-56 bg-surface border-r border-line flex flex-col min-h-screen shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-line">
        <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap size={15} className="text-white" fill="white" />
        </div>
        <span className="font-bold text-text-1 text-base tracking-tight">SplitMate</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive
                ? 'bg-brand/10 text-brand'
                : 'text-text-3 hover:text-text-1 hover:bg-raised'
            )}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      {user && (
        <div className="p-3 border-t border-line">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-raised transition-colors">
            <Avatar name={user.full_name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-1 truncate">{user.full_name}</p>
              <p className="text-xs text-text-3 truncate">@{user.username}</p>
            </div>
            <button
              onClick={async () => { await signOut(); navigate('/') }}
              className="text-text-3 hover:text-danger transition-colors p-1"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

export const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line flex md:hidden z-40">
    {NAV.map(({ to, icon: Icon, label }) => (
      <NavLink
        key={to}
        to={to}
        end={to === '/'}
        className={({ isActive }) => clsx(
          'flex-1 flex flex-col items-center gap-1 py-3',
          isActive ? 'text-brand' : 'text-text-3'
        )}
      >
        <Icon size={20} />
        <span className="text-[10px] font-medium">{label}</span>
      </NavLink>
    ))}
  </nav>
)