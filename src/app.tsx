import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Sidebar, BottomNav } from '@/components/layout/Sidebar'
import { AuthPage } from '@/pages/AuthPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { WalletPage } from '@/pages/WalletPage'
import { ExpensesPage } from '@/pages/ExpensesPage'
import { DebtsPage } from '@/pages/DebtsPage'
import { FriendsPage } from '@/pages/FriendsPage'

// Protected layout wrapper
const AppLayout = () => {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/auth" replace />
  return (
    <div className="flex min-h-screen bg-ink-50">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

// Loading screen
const Spinner = () => (
  <div className="min-h-screen bg-ink-50 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-ink-200 border-t-ink-900 rounded-full animate-spin" />
  </div>
)

export default function App() {
  const { initialize, initialized } = useAuthStore()

  useEffect(() => { initialize() }, [])

  if (!initialized) return <Spinner />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/debts" element={<DebtsPage />} />
          <Route path="/friends" element={<FriendsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}