import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Wallet, ArrowRight, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { Card, Amount, Avatar, Badge } from '@/components/ui'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/types'
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'

const StatCard = ({
  label, value, sub, icon, color
}: {
  label: string
  value: number
  sub?: string
  icon: React.ReactNode
  color: string
}) => (
  <Card>
    <div className="flex items-start justify-between mb-3">
      <p className="text-sm text-ink-400 font-medium">{label}</p>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
    <Amount value={value} size="lg" />
    {sub && <p className="text-xs text-ink-400 mt-1">{sub}</p>}
  </Card>
)

export const DashboardPage = () => {
  const { user } = useAuthStore()
  const { walletSummary, expenses, debts, fetchWallet, fetchExpenses, fetchDebts } = useAppStore()

  useEffect(() => {
    if (!user) return
    fetchWallet(user.id)
    fetchExpenses(user.id)
    fetchDebts(user.id)
  }, [user?.id])

  // Spend by category this month
  const thisMonth = new Date()
  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.expense_date)
    return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear()
      && e.paid_by === user?.id
  })

  const categoryData = Object.entries(
    monthExpenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + Number(e.total_amount)
      return acc
    }, {})
  )
    .map(([category, amount]) => ({
      category,
      name: CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category,
      amount,
      color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#6B7280',
    }))
    .sort((a, b) => b.amount - a.amount)

  const recentExpenses = expenses.slice(0, 5)
  const topDebts = debts.slice(0, 4)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-ink-900">
          Hey, {user?.full_name.split(' ')[0]} 👋
        </h1>
        <p className="text-ink-400 text-sm mt-0.5">
          {format(new Date(), 'EEEE, d MMMM yyyy')}
        </p>
      </div>

      {/* Summary stats */}
      {walletSummary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Total Owned"
            value={walletSummary.total_received}
            sub="All money received"
            icon={<Wallet size={16} className="text-ink-600" />}
            color="bg-ink-50"
          />
          <StatCard
            label="Available Now"
            value={walletSummary.currently_available}
            sub="After your spending"
            icon={<Wallet size={16} className="text-brand" />}
            color="bg-brand-light"
          />
          <StatCard
            label="Owed to You"
            value={walletSummary.owed_to_you}
            sub="Friends owe you"
            icon={<TrendingUp size={16} className="text-brand" />}
            color="bg-brand-light"
          />
          <StatCard
            label="You Owe"
            value={walletSummary.you_owe}
            sub="You owe friends"
            icon={<TrendingDown size={16} className="text-danger" />}
            color="bg-danger-light"
          />
        </div>
      )}

      {/* Net balance highlight */}
      {walletSummary && (
        <Card className="mb-6 bg-ink-900 border-ink-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/50 text-sm font-medium">Net Balance</p>
              <p className="text-xs text-white/30 mt-0.5">Available + Owed to you − You owe</p>
            </div>
            <div className="text-right">
              <span className={`font-mono font-bold text-3xl ${walletSummary.net_balance >= 0 ? 'text-brand' : 'text-danger'}`}>
                {walletSummary.net_balance >= 0 ? '+' : ''}Rs{' '}
                {Math.abs(walletSummary.net_balance).toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend by category */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink-900">This Month</h2>
            <Badge variant="default">{format(new Date(), 'MMM yyyy')}</Badge>
          </div>
          {categoryData.length === 0 ? (
            <p className="text-sm text-ink-300 py-4 text-center">No expenses this month</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={categoryData} barSize={28}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#898880' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: number) => [`Rs ${v.toLocaleString()}`, 'Amount']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E8E7E2' }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap gap-2">
                {categoryData.map((c) => (
                  <div key={c.category} className="flex items-center gap-1.5 text-xs text-ink-600">
                    <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                    {c.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Debts overview */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink-900">Debts</h2>
            <Link to="/debts" className="text-xs text-ink-400 hover:text-ink-900 flex items-center gap-1">
              See all <ArrowRight size={12} />
            </Link>
          </div>
          {topDebts.length === 0 ? (
            <p className="text-sm text-ink-300 py-4 text-center">All settled up! 🎉</p>
          ) : (
            <div className="flex flex-col gap-3">
              {topDebts.map((debt) => (
                <div key={debt.person.id} className="flex items-center gap-3">
                  <Avatar name={debt.person.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{debt.person.full_name}</p>
                    <p className="text-xs text-ink-400">
                      {debt.amount > 0 ? 'owes you' : 'you owe'}
                    </p>
                  </div>
                  <Amount value={Math.abs(debt.amount)} size="sm" colored showSign={false} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent expenses */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink-900">Recent Expenses</h2>
            <Link to="/expenses" className="text-xs text-ink-400 hover:text-ink-900 flex items-center gap-1">
              See all <ArrowRight size={12} />
            </Link>
          </div>
          {recentExpenses.length === 0 ? (
            <p className="text-sm text-ink-300 py-4 text-center">No expenses yet</p>
          ) : (
            <div className="flex flex-col divide-y divide-ink-50">
              {recentExpenses.map((exp) => (
                <div key={exp.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: CATEGORY_COLORS[exp.category] + '20', color: CATEGORY_COLORS[exp.category] }}
                  >
                    {exp.category === 'food' ? '🍔' : exp.category === 'transport' ? '🚕' : exp.category === 'groceries' ? '🛒' : exp.category === 'medicine' ? '💊' : '💳'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{exp.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-ink-400">{format(new Date(exp.expense_date), 'd MMM')}</span>
                      {exp.is_split && <Badge variant="info">Split</Badge>}
                    </div>
                  </div>
                  <div className="text-right">
                    <Amount value={exp.total_amount} size="sm" />
                    {exp.paid_by !== user?.id && (
                      <p className="text-xs text-ink-400">Your share</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}