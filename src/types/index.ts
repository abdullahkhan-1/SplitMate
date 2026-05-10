// Core domain types — matches Supabase schema exactly

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
  type: 'received' | 'spent'
  description: string
  created_at: string
}

export type ExpenseCategory =
  | 'food'
  | 'groceries'
  | 'transport'
  | 'medicine'
  | 'utilities'
  | 'entertainment'
  | 'other'

export interface Expense {
  id: string
  paid_by: string
  title: string
  amount: number
  category: ExpenseCategory
  split_type: 'solo' | 'equal' | 'custom'
  notes: string | null
  created_at: string
  // Joined fields
  payer?: Profile
  splits?: ExpenseSplit[]
}

export interface ExpenseSplit {
  id: string
  expense_id: string
  user_id: string
  amount_owed: number
  is_settled: boolean
  settled_at: string | null
  created_at: string
  // Joined fields
  user?: Profile
  expense?: Expense
}

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  // Joined fields
  requester?: Profile
  addressee?: Profile
}

export interface DebtEntry {
  person: Profile
  amount: number        // positive = they owe you, negative = you owe them
  unsettled_count: number
}

export interface WalletSummary {
  total_received: number
  total_spent: number
  currently_available: number
  net_balance: number
  owed_to_you: number
  you_owe: number
}

export interface NewExpenseForm {
  title: string
  amount: number
  category: ExpenseCategory
  notes: string
  split_type: 'solo' | 'equal' | 'custom'
  splits: { user_id: string; amount_owed: number }[]
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: 'Food & Dining',
  groceries: 'Groceries',
  transport: 'Transport',
  medicine: 'Medicine',
  utilities: 'Utilities',
  entertainment: 'Entertainment',
  other: 'Other',
}

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: '#F59E0B',
  groceries: '#22C55E',
  transport: '#3B82F6',
  medicine: '#EF4444',
  utilities: '#8B5CF6',
  entertainment: '#EC4899',
  other: '#6B7280',
}

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  food: '🍔',
  groceries: '🛒',
  transport: '🚕',
  medicine: '💊',
  utilities: '💡',
  entertainment: '🎮',
  other: '💳',
}