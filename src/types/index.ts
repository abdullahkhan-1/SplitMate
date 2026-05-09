// ============================================================
// Core domain types matching Supabase schema
// ============================================================

export interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  created_at: string
}

export interface WalletTransaction {
  id: string
  user_id: string
  amount: number
  note: string | null
  transaction_date: string
  created_at: string
}

export type ExpenseCategory =
  | 'food'
  | 'groceries'
  | 'transport'
  | 'medicine'
  | 'utilities'
  | 'entertainment'
  | 'study'
  | 'other'

export interface Expense {
  id: string
  paid_by: string
  total_amount: number
  description: string
  category: ExpenseCategory
  expense_date: string
  is_split: boolean
  note: string | null
  created_at: string
  // Joined fields
  payer?: Profile
  splits?: ExpenseSplit[]
}

export interface ExpenseSplit {
  id: string
  expense_id: string
  user_id: string
  amount: number
  is_settled: boolean
  settled_at: string | null
  created_at: string
  // Joined fields
  user?: Profile
  expense?: Expense
}

export type FriendshipStatus = 'pending' | 'accepted'

export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: FriendshipStatus
  created_at: string
  // Joined fields
  user?: Profile
  friend?: Profile
}

// ============================================================
// UI / computed types
// ============================================================

export interface DebtEntry {
  person: Profile
  amount: number        // positive = they owe you, negative = you owe them
  unsettled_count: number
}

export interface WalletSummary {
  total_received: number   // all money ever added to wallet
  total_spent: number      // all solo + your share of split expenses
  currently_available: number  // total_received - total_spent
  net_balance: number          // currently_available + owed_to_you - you_owe
  owed_to_you: number
  you_owe: number
}

export interface SpendByCategory {
  category: ExpenseCategory
  amount: number
}

export type SplitMode = 'equal' | 'manual'

export interface NewExpenseForm {
  description: string
  total_amount: number
  category: ExpenseCategory
  expense_date: string
  note: string
  is_split: boolean
  split_mode: SplitMode
  splits: { user_id: string; amount: number }[]
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: 'Food & Dining',
  groceries: 'Groceries',
  transport: 'Transport',
  medicine: 'Medicine',
  utilities: 'Utilities',
  entertainment: 'Entertainment',
  study: 'Study',
  other: 'Other',
}

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: '#F59E0B',
  groceries: '#22C55E',
  transport: '#3B82F6',
  medicine: '#EF4444',
  utilities: '#8B5CF6',
  entertainment: '#EC4899',
  study: '#06B6D4',
  other: '#6B7280',
}