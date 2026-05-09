import { useEffect } from 'react'
import { ArrowLeftRight, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { Card, Amount, Avatar, Button, Badge, EmptyState } from '@/components/ui'

export const DebtsPage = () => {
  const { user } = useAuthStore()
  const { debts, expenses, loadingDebts, fetchDebts, fetchExpenses, settleDebt, fetchWallet } = useAppStore()

  useEffect(() => {
    if (!user) return
    fetchDebts(user.id)
    fetchExpenses(user.id)
  }, [user?.id])

  const owedToMe = debts.filter((d) => d.amount > 0)
  const iOwe = debts.filter((d) => d.amount < 0)

  const totalOwedToMe = owedToMe.reduce((s, d) => s + d.amount, 0)
  const totalIOwe = iOwe.reduce((s, d) => s + Math.abs(d.amount), 0)

  // Get all unsettled splits for a given person
  const getUnsettledSplitsWith = (personId: string) =>
    expenses.filter(
      (e) =>
        e.paid_by === user?.id &&
        e.splits?.some((s) => s.user_id === personId && !s.is_settled)
    )

  const handleSettle = async (personId: string) => {
    const exps = getUnsettledSplitsWith(personId)
    for (const exp of exps) {
      await settleDebt(exp.id, personId)
    }
    fetchDebts(user!.id)
    fetchWallet(user!.id)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-ink-900">Debts</h1>
        <p className="text-ink-400 text-sm mt-0.5">Settle up with your friends</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="border-brand-light bg-brand-light/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={15} className="text-brand" />
            <p className="text-xs font-medium text-brand-dark">Owed to you</p>
          </div>
          <Amount value={totalOwedToMe} size="lg" colored />
          <p className="text-xs text-ink-400 mt-1">{owedToMe.length} {owedToMe.length === 1 ? 'person' : 'people'}</p>
        </Card>
        <Card className="border-danger-light bg-danger-light/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={15} className="text-danger" />
            <p className="text-xs font-medium text-danger">You owe</p>
          </div>
          <Amount value={totalIOwe} size="lg" colored />
          <p className="text-xs text-ink-400 mt-1">{iOwe.length} {iOwe.length === 1 ? 'person' : 'people'}</p>
        </Card>
      </div>

      {debts.length === 0 && !loadingDebts && (
        <EmptyState
          icon={<CheckCircle size={24} />}
          title="All settled up!"
          description="No outstanding debts. Everyone's square."
        />
      )}

      {/* Owed to me */}
      {owedToMe.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-ink-800 mb-3 flex items-center gap-2">
            <TrendingUp size={14} className="text-brand" />
            People who owe you
          </p>
          <div className="flex flex-col gap-2">
            {owedToMe.map((debt) => {
              const unsettled = getUnsettledSplitsWith(debt.person.id)
              return (
                <Card key={debt.person.id}>
                  <div className="flex items-center gap-3">
                    <Avatar name={debt.person.full_name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-900">{debt.person.full_name}</p>
                      <p className="text-xs text-ink-400">@{debt.person.username}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {unsettled.slice(0, 3).map((exp) => (
                          <Badge key={exp.id} variant="default">
                            {exp.description}
                          </Badge>
                        ))}
                        {unsettled.length > 3 && (
                          <Badge variant="default">+{unsettled.length - 3} more</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Amount value={debt.amount} size="md" colored />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSettle(debt.person.id)}
                      >
                        <CheckCircle size={13} />
                        Settled
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* I owe */}
      {iOwe.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-ink-800 mb-3 flex items-center gap-2">
            <TrendingDown size={14} className="text-danger" />
            You owe these people
          </p>
          <div className="flex flex-col gap-2">
            {iOwe.map((debt) => (
              <Card key={debt.person.id}>
                <div className="flex items-center gap-3">
                  <Avatar name={debt.person.full_name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink-900">{debt.person.full_name}</p>
                    <p className="text-xs text-ink-400">@{debt.person.username}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Amount value={Math.abs(debt.amount)} size="md" />
                    <Badge variant="danger">You owe</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {loadingDebts && (
        <p className="text-center text-sm text-ink-300 py-8">Loading…</p>
      )}
    </div>
  )
}