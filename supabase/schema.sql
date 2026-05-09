-- ============================================================
-- SplitMate Database Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username    TEXT UNIQUE NOT NULL,
  full_name   TEXT NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- WALLET TRANSACTIONS (money received from home, etc.)
-- ============================================================
CREATE TABLE wallet_transactions (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount           DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  note             TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wallet" ON wallet_transactions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- EXPENSE CATEGORIES
-- ============================================================
CREATE TYPE expense_category AS ENUM (
  'food', 'groceries', 'transport', 'medicine',
  'utilities', 'entertainment', 'study', 'other'
);

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE expenses (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  paid_by        UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  total_amount   DECIMAL(12,2) NOT NULL CHECK (total_amount > 0),
  description    TEXT NOT NULL,
  category       expense_category DEFAULT 'other',
  expense_date   DATE DEFAULT CURRENT_DATE,
  is_split       BOOLEAN DEFAULT FALSE,
  note           TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Payer can see + manage their expenses
CREATE POLICY "Payer can manage their expenses" ON expenses
  FOR ALL USING (auth.uid() = paid_by);

-- Participants can view expenses they're part of
CREATE POLICY "Participants can view their split expenses" ON expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM expense_splits
      WHERE expense_splits.expense_id = expenses.id
        AND expense_splits.user_id = auth.uid()
    )
  );

-- ============================================================
-- EXPENSE SPLITS (who owes what for each expense)
-- ============================================================
CREATE TABLE expense_splits (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  expense_id  UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount      DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  is_settled  BOOLEAN DEFAULT FALSE,
  settled_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(expense_id, user_id)
);

ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view splits involving them" ON expense_splits
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_splits.expense_id
        AND expenses.paid_by = auth.uid()
    )
  );

CREATE POLICY "Payer can manage splits" ON expense_splits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_splits.expense_id
        AND expenses.paid_by = auth.uid()
    )
  );

CREATE POLICY "Debtor can settle their own split" ON expense_splits
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- FRIENDSHIPS
-- ============================================================
CREATE TABLE friendships (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id  UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status     TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships" ON friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friendship status" ON friendships
  FOR UPDATE USING (auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships" ON friendships
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ============================================================
-- VIEWS for convenience
-- ============================================================

-- Net debt summary: what each user owes / is owed
CREATE VIEW debt_summary AS
SELECT
  e.paid_by AS creditor_id,
  es.user_id AS debtor_id,
  SUM(es.amount) AS total_owed,
  COUNT(*) AS unsettled_count
FROM expense_splits es
JOIN expenses e ON e.id = es.expense_id
WHERE es.is_settled = FALSE
  AND e.paid_by != es.user_id
GROUP BY e.paid_by, es.user_id;

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX idx_expense_splits_user ON expense_splits(user_id);
CREATE INDEX idx_expense_splits_expense ON expense_splits(expense_id);
CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);