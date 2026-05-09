import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type {
  WalletTransaction, Expense, ExpenseSplit,
  Friendship, Profile, WalletSummary, DebtEntry,
  NewExpenseForm
} from '@/types'

interface AppState {
  // Data
  walletTransactions: WalletTransaction[]
  expenses: Expense[]
  debts: DebtEntry[]
  friends: Profile[]
  pendingRequests: Friendship[]

  // Wallet summary (computed)
  walletSummary: WalletSummary | null

  // Loading states
  loadingWallet: boolean
  loadingExpenses: boolean
  loadingDebts: boolean
  loadingFriends: boolean

  // Actions — Wallet
  fetchWallet: (userId: string) => Promise<void>
  addFunds: (userId: string, amount: number, note?: string) => Promise<string | null>

  // Actions — Expenses
  fetchExpenses: (userId: string) => Promise<void>
  addExpense: (userId: string, form: NewExpenseForm) => Promise<string | null>
  deleteExpense: (expenseId: string) => Promise<string | null>

  // Actions — Debts
  fetchDebts: (userId: string) => Promise<void>
  settleDebt: (expenseId: string, debtorId: string) => Promise<string | null>

  // Actions — Friends
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

  // ——————————————————————————————————————————
  // WALLET
  // ——————————————————————————————————————————
  fetchWallet: async (userId) => {
    set({ loadingWallet: true })
    const { data: txns } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })

    // Get all expenses paid by user (their share)
    const { data: myExpenses } = await supabase
      .from('expenses')
      .select('total_amount, is_split, splits:expense_splits(user_id, amount, is_settled)')
      .eq('paid_by', userId)

    const totalReceived = (txns ?? []).reduce((s, t) => s + Number(t.amount), 0)

    // Total spent = solo expenses + what user paid minus what they'll get back
    let totalSpent = 0
    if (myExpenses) {
      for (const exp of myExpenses) {
        if (!exp.is_split) {
          totalSpent += Number(exp.total_amount)
        } else {
          // Paid full bill, will recover from others
          // What user personally spent = total - sum of others' shares
          const othersOwed = (exp.splits as ExpenseSplit[])
            .filter((s) => s.user_id !== userId && !s.is_settled)
            .reduce((sum, s) => sum + Number(s.amount), 0)
          const othersSettled = (exp.splits as ExpenseSplit[])
            .filter((s) => s.user_id !== userId && s.is_settled)
            .reduce((sum, s) => sum + Number(s.amount), 0)
          totalSpent += Number(exp.total_amount) - othersOwed - othersSettled
        }
      }
    }

    // Get what others owe user (unsettled splits from expenses user paid)
    const { data: owedToUser } = await supabase
      .from('expense_splits')
      .select('amount, expense:expenses!inner(paid_by)')
      .eq('expense.paid_by', userId)
      .eq('is_settled', false)
      .neq('user_id', userId)

    const owedToUserTotal = (owedToUser ?? []).reduce((s, r) => s + Number(r.amount), 0)

    // Get what user owes others (unsettled splits where user is debtor)
    const { data: userOwes } = await supabase
      .from('expense_splits')
      .select('amount, expense:expenses!inner(paid_by)')
      .eq('user_id', userId)
      .eq('is_settled', false)
      .neq('expense.paid_by', userId)

    const userOwesTotal = (userOwes ?? []).reduce((s, r) => s + Number(r.amount), 0)

    const currentlyAvailable = totalReceived - totalSpent

    set({
      walletTransactions: txns ?? [],
      walletSummary: {
        total_received: totalReceived,
        total_spent: totalSpent,
        currently_available: currentlyAvailable,
        net_balance: currentlyAvailable + owedToUserTotal - userOwesTotal,
        owed_to_you: owedToUserTotal,
        you_owe: userOwesTotal,
      },
      loadingWallet: false,
    })
  },

  addFunds: async (userId, amount, note) => {
    const { error } = await supabase.from('wallet_transactions').insert({
      user_id: userId,
      amount,
      note: note || null,
    })
    if (error) return error.message
    await get().fetchWallet(userId)
    return null
  },

  // ——————————————————————————————————————————
  // EXPENSES
  // ——————————————————————————————————————————
  fetchExpenses: async (userId) => {
    set({ loadingExpenses: true })
    const { data } = await supabase
      .from('expenses')
      .select(`
        *,
        payer:profiles!paid_by(*),
        splits:expense_splits(*, user:profiles(*))
      `)
      .or(`paid_by.eq.${userId},expense_splits.user_id.eq.${userId}`)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)

    set({ expenses: data ?? [], loadingExpenses: false })
  },

  addExpense: async (userId, form) => {
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        paid_by: userId,
        total_amount: form.total_amount,
        description: form.description,
        category: form.category,
        expense_date: form.expense_date,
        is_split: form.is_split,
        note: form.note || null,
      })
      .select()
      .single()

    if (error) return error.message

    if (form.is_split && form.splits.length > 0) {
      const { error: splitError } = await supabase
        .from('expense_splits')
        .insert(
          form.splits.map((s) => ({
            expense_id: expense.id,
            user_id: s.user_id,
            amount: s.amount,
          }))
        )
      if (splitError) return splitError.message
    }

    await get().fetchExpenses(userId)
    await get().fetchWallet(userId)
    return null
  },

  deleteExpense: async (expenseId) => {
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
    return error?.message ?? null
  },

  // ——————————————————————————————————————————
  // DEBTS
  // ——————————————————————————————————————————
  fetchDebts: async (userId) => {
    set({ loadingDebts: true })

    // What others owe user
    const { data: owedToMe } = await supabase
      .from('expense_splits')
      .select('amount, user:profiles!user_id(*), expense:expenses!inner(paid_by)')
      .eq('expense.paid_by', userId)
      .eq('is_settled', false)
      .neq('user_id', userId)

    // What user owes others
    const { data: iOwe } = await supabase
      .from('expense_splits')
      .select('amount, expense:expenses!inner(paid_by, payer:profiles!paid_by(*))')
      .eq('user_id', userId)
      .eq('is_settled', false)
      .neq('expense.paid_by', userId)

    const debtMap = new Map<string, DebtEntry>()

    // Positive = they owe me
    for (const row of (owedToMe ?? [])) {
      const person = row.user as Profile
      const existing = debtMap.get(person.id)
      if (existing) {
        existing.amount += Number(row.amount)
        existing.unsettled_count++
      } else {
        debtMap.set(person.id, { person, amount: Number(row.amount), unsettled_count: 1 })
      }
    }

    // Negative = I owe them
    for (const row of (iOwe ?? [])) {
      const payer = (row.expense as { payer: Profile }).payer
      const existing = debtMap.get(payer.id)
      if (existing) {
        existing.amount -= Number(row.amount)
        existing.unsettled_count++
      } else {
        debtMap.set(payer.id, { person: payer, amount: -Number(row.amount), unsettled_count: 1 })
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

  // ——————————————————————————————————————————
  // FRIENDS
  // ——————————————————————————————————————————
  fetchFriends: async (userId) => {
    set({ loadingFriends: true })
    const { data } = await supabase
      .from('friendships')
      .select('*, user:profiles!user_id(*), friend:profiles!friend_id(*)')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted')

    const { data: pending } = await supabase
      .from('friendships')
      .select('*, user:profiles!user_id(*), friend:profiles!friend_id(*)')
      .eq('friend_id', userId)
      .eq('status', 'pending')

    const friends = (data ?? []).map((f) =>
      f.user_id === userId ? (f.friend as Profile) : (f.user as Profile)
    )

    set({
      friends,
      pendingRequests: pending ?? [],
      loadingFriends: false,
    })
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
      .from('friendships')
      .insert({ user_id: userId, friend_id: friendId })
    return error?.message ?? null
  },

  acceptFriendRequest: async (friendshipId) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
    return error?.message ?? null
  },
}))