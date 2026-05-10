import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Profile, WalletSummary, DebtEntry, NewExpenseForm } from '@/types'

interface WalletTransaction {
  id: string
  user_id: string
  amount: number
  type: 'received' | 'spent'
  description: string
  created_at: string
}

interface Expense {
  id: string
  paid_by: string
  title: string
  amount: number
  category: string
  split_type: 'solo' | 'equal' | 'custom'
  notes?: string
  created_at: string
  payer?: Profile
  splits?: ExpenseSplit[]
}

interface ExpenseSplit {
  id: string
  expense_id: string
  user_id: string
  amount_owed: number
  is_settled: boolean
  settled_at?: string
  created_at: string
  user?: Profile
}

interface AppState {
  walletTransactions: WalletTransaction[]
  expenses: Expense[]
  debts: DebtEntry[]
  friends: Profile[]
  pendingRequests: any[]
  walletSummary: WalletSummary | null
  loadingWallet: boolean
  loadingExpenses: boolean
  loadingDebts: boolean
  loadingFriends: boolean

  fetchWallet: (userId: string) => Promise<void>
  addFunds: (userId: string, amount: number, note?: string) => Promise<string | null>
  fetchExpenses: (userId: string) => Promise<void>
  addExpense: (userId: string, form: NewExpenseForm) => Promise<string | null>
  deleteExpense: (expenseId: string, userId: string) => Promise<string | null>
  fetchDebts: (userId: string) => Promise<void>
  settleDebt: (expenseId: string, debtorId: string) => Promise<string | null>
  fetchFriends: (userId: string) => Promise<void>
  searchUsers: (query: string) => Promise<Profile[]>
  sendFriendRequest: (userId: string, friendId: string) => Promise<string | null>
  acceptFriendRequest: (friendshipId: string) => Promise<string | null>
}

export const useAppStore = create<AppState>((set, get) => ({
  walletTransactions: [],
  expenses: [],
  debts: [],
  friends: [],
  pendingRequests: [],
  walletSummary: null,
  loadingWallet: false,
  loadingExpenses: false,
  loadingDebts: false,
  loadingFriends: false,

  // ─── WALLET ───────────────────────────────────────────────
  fetchWallet: async (userId) => {
    set({ loadingWallet: true })

    // All received transactions
    const { data: txns } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'received')
      .order('created_at', { ascending: false })

    const totalReceived = (txns ?? []).reduce((s, t) => s + Number(t.amount), 0)

    // Solo expenses paid by user
    const { data: soloExp } = await supabase
      .from('expenses')
      .select('amount')
      .eq('paid_by', userId)
      .eq('split_type', 'solo')

    const soloSpent = (soloExp ?? []).reduce((s, e) => s + Number(e.amount), 0)

    // What others owe user (unsettled splits on user's expenses)
    const { data: owedRows } = await supabase
      .from('expense_splits')
      .select('amount_owed, expense:expenses!inner(paid_by)')
      .eq('expense.paid_by' as any, userId)
      .eq('is_settled', false)
      .neq('user_id', userId)

    const owedToUser = (owedRows ?? []).reduce((s, r) => s + Number(r.amount_owed), 0)

    // What user owes others (unsettled splits where user is debtor)
    const { data: iOweRows } = await supabase
      .from('expense_splits')
      .select('amount_owed, expense:expenses!inner(paid_by)')
      .eq('user_id', userId)
      .eq('is_settled', false)
      .neq('expense.paid_by' as any, userId)

    const youOwe = (iOweRows ?? []).reduce((s, r) => s + Number(r.amount_owed), 0)

    const totalSpent = soloSpent + youOwe
    const currentlyAvailable = totalReceived - totalSpent

    set({
      walletTransactions: txns ?? [],
      walletSummary: {
        total_received: totalReceived,
        total_spent: totalSpent,
        currently_available: currentlyAvailable,
        net_balance: currentlyAvailable + owedToUser - youOwe,
        owed_to_you: owedToUser,
        you_owe: youOwe,
      },
      loadingWallet: false,
    })
  },

  addFunds: async (userId, amount, note) => {
    const { error } = await supabase.from('wallet_transactions').insert({
      user_id: userId,
      amount,
      type: 'received',
      description: note || 'Money received',
    })
    if (error) return error.message
    await get().fetchWallet(userId)
    return null
  },

  // ─── EXPENSES ─────────────────────────────────────────────
  fetchExpenses: async (userId) => {
    set({ loadingExpenses: true })

    const { data } = await supabase
      .from('expenses')
      .select(`
        *,
        payer:profiles!paid_by(*),
        splits:expense_splits(*, user:profiles(*))
      `)
      .or(`paid_by.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(100)

    set({ expenses: data ?? [], loadingExpenses: false })
  },

  addExpense: async (userId, form) => {
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        paid_by: userId,
        title: form.title,
        amount: form.amount,
        category: form.category,
        split_type: form.split_type,
        notes: form.notes || null,
      })
      .select()
      .single()

    if (error) return error.message

    if (form.split_type !== 'solo' && form.splits && form.splits.length > 0) {
      const { error: splitError } = await supabase
        .from('expense_splits')
        .insert(
          form.splits.map((s: any) => ({
            expense_id: expense.id,
            user_id: s.user_id,
            amount_owed: s.amount_owed,
          }))
        )
      if (splitError) return splitError.message
    }

    await get().fetchExpenses(userId)
    await get().fetchWallet(userId)
    return null
  },

  deleteExpense: async (expenseId, userId) => {
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
    if (error) return error.message
    await get().fetchExpenses(userId)
    return null
  },

  // ─── DEBTS ────────────────────────────────────────────────
  fetchDebts: async (userId) => {
    set({ loadingDebts: true })

    const { data: owedToMe } = await supabase
      .from('expense_splits')
      .select('amount_owed, user:profiles!user_id(*), expense:expenses!inner(paid_by)')
      .eq('expense.paid_by' as any, userId)
      .eq('is_settled', false)
      .neq('user_id', userId)

    const { data: iOwe } = await supabase
      .from('expense_splits')
      .select('amount_owed, expense:expenses!inner(paid_by, payer:profiles!paid_by(*))')
      .eq('user_id', userId)
      .eq('is_settled', false)
      .neq('expense.paid_by' as any, userId)

    const debtMap = new Map<string, DebtEntry>()

    for (const row of (owedToMe ?? [])) {
      const person = row.user as Profile
      const existing = debtMap.get(person.id)
      if (existing) {
        existing.amount += Number(row.amount_owed)
        existing.unsettled_count++
      } else {
        debtMap.set(person.id, { person, amount: Number(row.amount_owed), unsettled_count: 1 })
      }
    }

    for (const row of (iOwe ?? [])) {
      const payer = (row.expense as any).payer as Profile
      if (!payer) continue
      const existing = debtMap.get(payer.id)
      if (existing) {
        existing.amount -= Number(row.amount_owed)
        existing.unsettled_count++
      } else {
        debtMap.set(payer.id, { person: payer, amount: -Number(row.amount_owed), unsettled_count: 1 })
      }
    }

    set({ debts: Array.from(debtMap.values()), loadingDebts: false })
  },

  settleDebt: async (expenseId, debtorId) => {
    const { error } = await supabase
      .from('expense_splits')
      .update({ is_settled: true, settled_at: new Date().toISOString() })
      .eq('expense_id', expenseId)
      .eq('user_id', debtorId)
    return error?.message ?? null
  },

  // ─── FRIENDS ──────────────────────────────────────────────
  fetchFriends: async (userId) => {
    set({ loadingFriends: true })

    const { data: accepted } = await supabase
      .from('friends')
      .select('*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted')

    const { data: pending } = await supabase
      .from('friends')
      .select('*, requester:profiles!requester_id(*)')
      .eq('addressee_id', userId)
      .eq('status', 'pending')

    const friends = (accepted ?? []).map((f) =>
      f.requester_id === userId
        ? (f.addressee as Profile)
        : (f.requester as Profile)
    )

    set({ friends, pendingRequests: pending ?? [], loadingFriends: false })
  },

  searchUsers: async (query) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10)
    return data ?? []
  },

  sendFriendRequest: async (userId, friendId) => {
    const { error } = await supabase
      .from('friends')
      .insert({ requester_id: userId, addressee_id: friendId })
    return error?.message ?? null
  },

  acceptFriendRequest: async (friendshipId) => {
    const { error } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
    return error?.message ?? null
  },
}))