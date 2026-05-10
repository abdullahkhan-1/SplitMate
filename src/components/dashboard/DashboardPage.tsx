import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Wallet, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { Card, Amount, Avatar, Badge, StatCard } from '@/components/ui'
import { CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS, type ExpenseCategory } from '@/types'
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'

export const DashboardPage = () => {
  const { user } = useAuthStore()
  const { walletSummary, expenses, debts, fetchWallet, fetchExpenses, fetchDebts } = useAppStore()

  useEffect(() => {
    if (!user) return
    fetchWallet(user.id)
    fetchExpenses(user.id)
    fetchDebts(user.id)
  }, [user?.id])

  const now = new Date()
  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && e.paid_by === user?.id
  })

  const categoryData = Object.entries(
    monthExpenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount)
      return acc
    }, {})
  )
    .map(([category, amount]) => ({
      category, amount,
      name: CATEGORY_LABELS[category as ExpenseCategory] || category,
      color: CATEGORY_COLORS[category as ExpenseCategory] || '#555',
    }))
    .sort((a, b) => b.amount - a.amount)

  const recentExpenses = expenses.slice(0, 5)
  const topDebts = debts.slice(0, 4)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-text-1">
          Hey, {user?.full_name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="text-sm text-text-3 mt-1">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      {/* Net balance hero */}
      {walletSummary && (
        <div className="bg-surface border border-line rounded-2xl p-6 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-3 uppercase tracking-widest mb-1">Net Balance</p>
            <p className="text-xs text-text-3">Available + Owed to you − You owe</p>
          </div>
          <span className={`font-mono font-bold text-3xl ${walletSummary.net_balance >= 0 ? 'text-brand' : 'text-danger'}`}>
            {walletSummary.net_balance >= 0 ? '+' : '-'}Rs {Math.abs(walletSummary.net_balance).toLocaleString('en-PK', { maximumFractionDigits: 0 })}
          </span>
        </div>
      )}

      {/* Stats */}
      {walletSummary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatCard label="Total Owned" value={walletSummary.total_received} sub="All received" icon={<Wallet size={15} className="text-text-2" />} accent="bg-raised border border-line" />
          <StatCard label="Available" value={walletSummary.currently_available} sub="After spending" icon={<Wallet size={15} className="text-brand" />} accent="bg-brand-dim border border-brand/20" />
          <StatCard label="Owed to You" value={walletSummary.owed_to_you} sub="Friends owe" icon={<TrendingUp size={15} className="text-brand" />} accent="bg-brand-dim border border-brand/20" />
          <StatCard label="You Owe" value={walletSummary.you_owe} sub="To friends" icon={<TrendingDown size={15} className="text-danger" />} accent="bg-danger-dim border border-danger/20" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Spend chart */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-text-1">This Month</p>
            <Badge variant="default">{format(new Date(), 'MMM yyyy')}</Badge>
          </div>
          {categoryData.length === 0 ? (
            <p className="text-sm text-text-3 py-8 text-center">No expenses this month</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={categoryData} barSize={24}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#525252' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: number) => [`Rs ${v.toLocaleString()}`, 'Amount']}
                    contentStyle={{ background: '#1C1C1C', border: '1px solid #262626', borderRadius: 10, fontSize: 12, color: '#FAFAFA' }}
                    cursor={{ fill: '#ffffff08' }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-wrap gap-2">
                {categoryData.map((c) => (
                  <div key={c.category} className="flex items-center gap-1.5 text-xs text-text-3">
                    <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                    {c.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Debts */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-text-1">Debts</p>
            <Link to="/debts" className="text-xs text-text-3 hover:text-brand flex items-center gap-1 transition-colors">
              See all <ArrowRight size={12} />
            </Link>
          </div>
          {topDebts.length === 0 ? (
            <p className="text-sm text-text-3 py-8 text-center">All settled up 🎉</p>
          ) : (
            <div className="flex flex-col gap-3">
              {topDebts.map((debt) => (
                <div key={debt.person.id} className="flex items-center gap-3">
                  <Avatar name={debt.person.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-1 truncate">{debt.person.full_name}</p>
                    <p className="text-xs text-text-3">{debt.amount > 0 ? 'owes you' : 'you owe'}</p>
                  </div>
                  <Amount value={Math.abs(debt.amount)} size="sm" colored />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent expenses */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-text-1">Recent Expenses</p>
            <Link to="/expenses" className="text-xs text-text-3 hover:text-brand flex items-center gap-1 transition-colors">
              See all <ArrowRight size={12} />
            </Link>
          </div>
          {recentExpenses.length === 0 ? (
            <p className="text-sm text-text-3 py-6 text-center">No expenses yet</p>
          ) : (
            <div className="flex flex-col divide-y divide-line">
              {recentExpenses.map((exp) => (
                <div key={exp.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: (CATEGORY_COLORS[exp.category] ?? '#555') + '20' }}>
                    {CATEGORY_ICONS[exp.category] ?? '💳'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-1 truncate">{exp.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-3">{format(new Date(exp.created_at), 'd MMM')}</span>
                      {exp.split_type !== 'solo' && <Badge variant="info">Split</Badge>}
                    </div>
                  </div>
                  <Amount value={exp.amount} size="sm" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}