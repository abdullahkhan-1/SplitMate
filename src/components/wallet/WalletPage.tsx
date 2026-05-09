import { useEffect, useState } from 'react'
import { PlusCircle, Wallet, TrendingDown, TrendingUp, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { Button, Card, Input, Modal, Amount } from '@/components/ui'

export const WalletPage = () => {
  const { user } = useAuthStore()
  const { walletSummary, walletTransactions, loadingWallet, fetchWallet, addFunds } = useAppStore()

  const [showAdd, setShowAdd] = useState(false)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) fetchWallet(user.id)
  }, [user?.id])

  const handleAddFunds = async () => {
    const val = parseFloat(amount)
    if (!val || val <= 0) { setError('Enter a valid amount'); return }
    setSaving(true)
    const err = await addFunds(user!.id, val, note)
    setSaving(false)
    if (err) { setError(err); return }
    setShowAdd(false)
    setAmount('')
    setNote('')
    setError('')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900">My Wallet</h1>
          <p className="text-ink-400 text-sm mt-0.5">Track money received from home</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <PlusCircle size={16} />
          Add Funds
        </Button>
      </div>

      {/* Summary breakdown */}
      {walletSummary && (
        <div className="grid grid-cols-1 gap-3 mb-6">
          {/* Big balance card */}
          <Card className="bg-ink-900 border-ink-900">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-white/40 text-xs font-medium uppercase tracking-widest">Total Owned</p>
                <p className="text-white/60 text-sm mt-0.5">All money you've received</p>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Wallet size={18} className="text-white/70" />
              </div>
            </div>
            <span className="font-mono font-bold text-4xl text-white">
              Rs {walletSummary.total_received.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
            </span>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={14} className="text-danger" />
                <p className="text-xs text-ink-400 font-medium">Spent</p>
              </div>
              <Amount value={walletSummary.total_spent} size="md" />
            </Card>
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={14} className="text-brand" />
                <p className="text-xs text-ink-400 font-medium">Available</p>
              </div>
              <Amount value={walletSummary.currently_available} size="md" />
            </Card>
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-info" />
                <p className="text-xs text-ink-400 font-medium">Net</p>
              </div>
              <Amount
                value={walletSummary.net_balance}
                size="md"
                colored
              />
            </Card>
          </div>

          {/* Breakdown bar */}
          {walletSummary.total_received > 0 && (
            <Card>
              <p className="text-sm font-medium text-ink-800 mb-3">Balance Breakdown</p>
              <div className="h-3 bg-ink-50 rounded-full overflow-hidden flex">
                <div
                  className="bg-danger h-full transition-all"
                  style={{ width: `${Math.min(100, (walletSummary.total_spent / walletSummary.total_received) * 100)}%` }}
                />
                <div
                  className="bg-warn h-full transition-all"
                  style={{ width: `${Math.min(100, (walletSummary.you_owe / walletSummary.total_received) * 100)}%` }}
                />
              </div>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-ink-500">
                  <span className="w-2 h-2 rounded-full bg-danger" />
                  Spent
                </div>
                <div className="flex items-center gap-1.5 text-xs text-ink-500">
                  <span className="w-2 h-2 rounded-full bg-warn" />
                  Owed
                </div>
                <div className="flex items-center gap-1.5 text-xs text-ink-500">
                  <span className="w-2 h-2 rounded-full bg-ink-100" />
                  Available
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Transaction history */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-ink-400" />
          <h2 className="font-display font-semibold text-ink-900">Money Received</h2>
        </div>
        {loadingWallet ? (
          <p className="text-sm text-ink-300 py-4 text-center">Loading…</p>
        ) : walletTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-ink-300">No funds added yet.</p>
            <p className="text-xs text-ink-200 mt-1">Add your first amount to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-ink-50">
            {walletTransactions.map((txn) => (
              <div key={txn.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="w-8 h-8 bg-brand-light rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={14} className="text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900">
                    {txn.note || 'Money received'}
                  </p>
                  <p className="text-xs text-ink-400">
                    {format(new Date(txn.transaction_date), 'd MMM yyyy')}
                  </p>
                </div>
                <Amount value={txn.amount} size="sm" colored />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Funds Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Funds">
        <div className="flex flex-col gap-4">
          <Input
            label="Amount (Rs)"
            type="number"
            placeholder="5000"
            prefix="Rs"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError('') }}
            error={error}
            autoFocus
          />
          <Input
            label="Note (optional)"
            placeholder="From home, pocket money…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleAddFunds} loading={saving} className="flex-1">
              Add Rs {parseFloat(amount) > 0 ? parseFloat(amount).toLocaleString() : '—'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}