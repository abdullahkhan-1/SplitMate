import { useEffect, useState } from 'react'
import { PlusCircle, Receipt, Trash2, Users, User } from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import {
  Button, Card, Input, Select, Modal, Badge, Avatar,
  Amount, EmptyState
} from '@/components/ui'
import {
  CATEGORY_LABELS, CATEGORY_COLORS, type ExpenseCategory,
  type NewExpenseForm
} from '@/types'

const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))

// Must exactly match the schema CHECK constraint — no 'study'
const EMOJI: Record<ExpenseCategory, string> = {
  food: '🍔',
  groceries: '🛒',
  transport: '🚕',
  medicine: '💊',
  utilities: '🔌',
  entertainment: '🎮',
  other: '💳',
}

export const ExpensesPage = () => {
  const { user } = useAuthStore()
  const { expenses, friends, loadingExpenses, fetchExpenses, fetchFriends, addExpense, deleteExpense } = useAppStore()

  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterCat, setFilterCat] = useState<string>('all')

  // Uses NewExpenseForm field names exactly as defined in types/index.ts
  const emptyForm = (): NewExpenseForm => ({
    title: '',
    amount: 0,
    category: 'other',
    notes: '',
    split_type: 'solo',
    splits: [],
  })

  const [form, setForm] = useState<NewExpenseForm>(emptyForm())
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([])
  const [manualAmounts, setManualAmounts] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!user) return
    fetchExpenses(user.id)
    fetchFriends(user.id)
  }, [user?.id])

  // Recalculate splits when friends, amount, or split_type changes
  useEffect(() => {
    const isSplit = form.split_type !== 'solo'
    if (!isSplit || selectedFriendIds.length === 0) {
      setForm((f) => ({ ...f, splits: [] }))
      return
    }
    const totalParticipants = selectedFriendIds.length + 1 // friends + paying user
    if (form.split_type === 'equal') {
      const each = form.amount / totalParticipants
      setForm((f) => ({
        ...f,
        splits: selectedFriendIds.map((id) => ({
          user_id: id,
          amount_owed: parseFloat(each.toFixed(2)),
        })),
      }))
    } else {
      // custom — use manually entered amounts
      setForm((f) => ({
        ...f,
        splits: selectedFriendIds.map((id) => ({
          user_id: id,
          amount_owed: parseFloat(manualAmounts[id] || '0'),
        })),
      }))
    }
  }, [form.split_type, form.amount, selectedFriendIds, manualAmounts])

  const toggleFriend = (id: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Add a title/description'); return }
    if (!form.amount || form.amount <= 0) { setError('Enter a valid amount'); return }
    if (form.split_type !== 'solo' && selectedFriendIds.length === 0) {
      setError('Select at least one friend to split with')
      return
    }
    setSaving(true)
    const err = await addExpense(user!.id, form)
    setSaving(false)
    if (err) { setError(err); return }
    setShowAdd(false)
    setForm(emptyForm())
    setSelectedFriendIds([])
    setManualAmounts({})
    setError('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    await deleteExpense(id, user!.id) // deleteExpense requires (expenseId, userId)
    fetchExpenses(user!.id)
  }

  const filtered = filterCat === 'all'
    ? expenses
    : expenses.filter((e) => e.category === filterCat)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900">Expenses</h1>
          <p className="text-ink-400 text-sm mt-0.5">{expenses.length} total recorded</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <PlusCircle size={16} />
          Add Expense
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filterCat === 'all' ? 'bg-ink-900 text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
          }`}
        >
          All
        </button>
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilterCat(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filterCat === value ? 'bg-ink-900 text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
            }`}
          >
            {EMOJI[value as ExpenseCategory]} {label}
          </button>
        ))}
      </div>

      {/* Expense list */}
      {loadingExpenses ? (
        <p className="text-center text-ink-300 py-8">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Receipt size={24} />}
          title="No expenses yet"
          description="Start tracking your spending"
          action={
            <Button onClick={() => setShowAdd(true)} size="sm">
              <PlusCircle size={14} />
              Add first expense
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((exp) => {
            const isMyExpense = exp.paid_by === user?.id
            const myShare = exp.splits?.find((s) => s.user_id === user?.id)
            return (
              <Card key={exp.id} className="group">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: (CATEGORY_COLORS[exp.category] ?? '#6B7280') + '18' }}
                  >
                    {EMOJI[exp.category] ?? '💳'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink-900 truncate">{exp.title}</p>
                      {exp.split_type !== 'solo' && (
                        <Badge variant="info">
                          <Users size={10} />
                          Split
                        </Badge>
                      )}
                      {!isMyExpense && (
                        <Badge variant="warn">Not paid by you</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-ink-400">
                        {format(new Date(exp.created_at), 'd MMM yyyy')}
                      </p>
                      <span className="text-ink-200">·</span>
                      <p className="text-xs text-ink-400">{CATEGORY_LABELS[exp.category]}</p>
                    </div>
                    {exp.split_type !== 'solo' && exp.splits && exp.splits.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {exp.splits.slice(0, 4).map((s) => (
                          <Avatar key={s.id} name={s.user?.full_name || '?'} size="sm" />
                        ))}
                        {exp.splits.length > 4 && (
                          <span className="text-xs text-ink-400">+{exp.splits.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <Amount value={exp.amount} size="md" />
                    {myShare && (
                      <p className="text-xs text-ink-400">
                        Your share: Rs {Number(myShare.amount_owed).toLocaleString()}
                      </p>
                    )}
                    {isMyExpense && (
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-danger transition-all p-0.5"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Expense Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setError('') }} title="New Expense" size="lg">
        <div className="flex flex-col gap-4">
          <Input
            label="What was it for?"
            placeholder="Dinner at McDonald's, groceries…"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount (Rs)"
              type="number"
              placeholder="0"
              prefix="Rs"
              value={form.amount || ''}
              onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
            />
            <Select
              label="Category"
              options={CATEGORIES}
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
            />
          </div>

          {/* Solo vs Split toggle — drives split_type field */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setForm((f) => ({ ...f, split_type: 'solo', splits: [] }))
                setSelectedFriendIds([])
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                form.split_type === 'solo'
                  ? 'bg-ink-900 text-white border-ink-900'
                  : 'border-ink-100 text-ink-600 hover:border-ink-200'
              }`}
            >
              <User size={15} /> Solo expense
            </button>
            <button
              onClick={() => setForm((f) => ({ ...f, split_type: 'equal' }))}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                form.split_type !== 'solo'
                  ? 'bg-ink-900 text-white border-ink-900'
                  : 'border-ink-100 text-ink-600 hover:border-ink-200'
              }`}
            >
              <Users size={15} /> Split with friends
            </button>
          </div>

          {/* Split section */}
          {form.split_type !== 'solo' && (
            <div className="bg-ink-50 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-sm font-medium text-ink-800">Who's splitting with you?</p>
              {friends.length === 0 ? (
                <p className="text-sm text-ink-400">No friends added yet. Go to Friends tab first.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {friends.map((f) => (
                    <div key={f.id} className="flex items-center gap-3">
                      <button
                        onClick={() => toggleFriend(f.id)}
                        className={`w-5 h-5 rounded border-2 flex-shrink-0 transition-colors ${
                          selectedFriendIds.includes(f.id)
                            ? 'bg-ink-900 border-ink-900'
                            : 'border-ink-300'
                        }`}
                      >
                        {selectedFriendIds.includes(f.id) && (
                          <svg viewBox="0 0 12 12" fill="none" className="text-white">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                      <Avatar name={f.full_name} size="sm" />
                      <span className="text-sm text-ink-800 flex-1">{f.full_name}</span>
                      {selectedFriendIds.includes(f.id) && form.split_type === 'custom' && (
                        <input
                          type="number"
                          className="w-24 px-2 py-1 text-sm border border-ink-200 rounded-lg text-right font-mono"
                          placeholder="0"
                          value={manualAmounts[f.id] || ''}
                          onChange={(e) => setManualAmounts((m) => ({ ...m, [f.id]: e.target.value }))}
                        />
                      )}
                      {selectedFriendIds.includes(f.id) && form.split_type === 'equal' && form.amount > 0 && (
                        <span className="text-sm font-mono text-ink-500">
                          Rs {(form.amount / (selectedFriendIds.length + 1)).toFixed(0)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedFriendIds.length > 0 && (
                <div className="flex gap-2 pt-1 border-t border-ink-100">
                  <button
                    onClick={() => setForm((f) => ({ ...f, split_type: 'equal' }))}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      form.split_type === 'equal' ? 'bg-ink-900 text-white' : 'bg-white text-ink-600 border border-ink-200'
                    }`}
                  >
                    Equal split
                  </button>
                  <button
                    onClick={() => setForm((f) => ({ ...f, split_type: 'custom' }))}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      form.split_type === 'custom' ? 'bg-ink-900 text-white' : 'bg-white text-ink-600 border border-ink-200'
                    }`}
                  >
                    Custom amounts
                  </button>
                </div>
              )}

              {selectedFriendIds.length > 0 && form.amount > 0 && (
                <div className="bg-white rounded-lg p-3 text-sm text-ink-600">
                  <p>
                    You pay:{' '}
                    <span className="font-mono font-semibold text-ink-900">
                      Rs {(form.amount - form.splits.reduce((s, sp) => s + sp.amount_owed, 0)).toFixed(0)}
                    </span>
                  </p>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Others will owe you their share from total Rs {form.amount.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          <Input
            label="Note (optional)"
            placeholder="Any details…"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />

          {error && (
            <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-2 mt-1">
            <Button variant="secondary" onClick={() => setShowAdd(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={saving} className="flex-1">
              Save Expense
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
