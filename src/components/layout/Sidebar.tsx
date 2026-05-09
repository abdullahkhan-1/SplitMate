import { NavLink, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Wallet, Receipt, Users,
  ArrowLeftRight, LogOut, Coins
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/wallet',    icon: Wallet,          label: 'My Wallet'  },
  { to: '/expenses',  icon: Receipt,         label: 'Expenses'   },
  { to: '/debts',     icon: ArrowLeftRight,  label: 'Debts'      },
  { to: '/friends',   icon: Users,           label: 'Friends'    },
]

export const Sidebar = () => {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <aside className="w-60 bg-ink-900 flex flex-col min-h-screen shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
          <Coins size={16} className="text-white" />
        </div>
        <span className="font-display font-bold text-white text-lg tracking-tight">
          SplitMate
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + sign out */}
      {user && (
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar name={user.full_name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
              <p className="text-xs text-white/40 truncate">@{user.username}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-white/30 hover:text-white/70 transition-colors p-1"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

// Mobile bottom nav
export const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ink-100 flex md:hidden z-40">
    {NAV.map(({ to, icon: Icon, label }) => (
      <NavLink
        key={to}
        to={to}
        end={to === '/'}
        className={({ isActive }) =>
          clsx(
            'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
            isActive ? 'text-ink-900' : 'text-ink-300'
          )
        }
      >
        <Icon size={20} />
        <span className="text-[10px]">{label}</span>
      </NavLink>
    ))}
  </nav>
)