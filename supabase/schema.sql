create extension if not exists "uuid-ossp";

-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table public.profiles enable row level security;
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- WALLETS
create table if not exists public.wallets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  total_received numeric(12,2) default 0 not null,
  total_spent numeric(12,2) default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table public.wallets enable row level security;
create policy "wallets_select" on public.wallets for select using (auth.uid() = user_id);
create policy "wallets_insert" on public.wallets for insert with check (auth.uid() = user_id);
create policy "wallets_update" on public.wallets for update using (auth.uid() = user_id);

-- WALLET TRANSACTIONS
create table if not exists public.wallet_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12,2) not null,
  type text check (type in ('received','spent')) not null,
  description text not null,
  created_at timestamptz default now() not null
);
alter table public.wallet_transactions enable row level security;
create policy "wt_select" on public.wallet_transactions for select using (auth.uid() = user_id);
create policy "wt_insert" on public.wallet_transactions for insert with check (auth.uid() = user_id);
create policy "wt_delete" on public.wallet_transactions for delete using (auth.uid() = user_id);

-- FRIENDS
create table if not exists public.friends (
  id uuid default uuid_generate_v4() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending','accepted','declined')) default 'pending' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(requester_id, addressee_id)
);
alter table public.friends enable row level security;
create policy "friends_select" on public.friends for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "friends_insert" on public.friends for insert with check (auth.uid() = requester_id);
create policy "friends_update" on public.friends for update using (auth.uid() = addressee_id or auth.uid() = requester_id);
create policy "friends_delete" on public.friends for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- EXPENSES (select policy added later, after expense_splits exists)
create table if not exists public.expenses (
  id uuid default uuid_generate_v4() primary key,
  paid_by uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  amount numeric(12,2) not null,
  category text check (category in ('food','transport','groceries','medicine','entertainment','utilities','other')) default 'other' not null,
  split_type text check (split_type in ('solo','equal','custom')) default 'solo' not null,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table public.expenses enable row level security;
create policy "expenses_insert" on public.expenses for insert with check (auth.uid() = paid_by);
create policy "expenses_update" on public.expenses for update using (auth.uid() = paid_by);
create policy "expenses_delete" on public.expenses for delete using (auth.uid() = paid_by);

-- EXPENSE SPLITS
create table if not exists public.expense_splits (
  id uuid default uuid_generate_v4() primary key,
  expense_id uuid references public.expenses(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount_owed numeric(12,2) not null,
  is_settled boolean default false not null,
  settled_at timestamptz,
  created_at timestamptz default now() not null,
  unique(expense_id, user_id)
);
alter table public.expense_splits enable row level security;
create policy "splits_select" on public.expense_splits for select using (
  auth.uid() = user_id or
  exists (select 1 from public.expenses where expenses.id = expense_splits.expense_id and expenses.paid_by = auth.uid())
);
create policy "splits_insert" on public.expense_splits for insert with check (
  exists (select 1 from public.expenses where expenses.id = expense_splits.expense_id and expenses.paid_by = auth.uid())
);
create policy "splits_update" on public.expense_splits for update using (
  auth.uid() = user_id or
  exists (select 1 from public.expenses where expenses.id = expense_splits.expense_id and expenses.paid_by = auth.uid())
);
create policy "splits_delete" on public.expense_splits for delete using (
  exists (select 1 from public.expenses where expenses.id = expense_splits.expense_id and expenses.paid_by = auth.uid())
);

-- expenses SELECT policy (now expense_splits exists)
create policy "expenses_select" on public.expenses for select using (
  auth.uid() = paid_by or
  exists (select 1 from public.expense_splits where expense_splits.expense_id = expenses.id and expense_splits.user_id = auth.uid())
);

-- SETTLEMENTS
create table if not exists public.settlements (
  id uuid default uuid_generate_v4() primary key,
  payer_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12,2) not null,
  notes text,
  created_at timestamptz default now() not null
);
alter table public.settlements enable row level security;
create policy "settlements_select" on public.settlements for select using (auth.uid() = payer_id or auth.uid() = receiver_id);
create policy "settlements_insert" on public.settlements for insert with check (auth.uid() = payer_id);

-- TRIGGER: auto-create profile + wallet on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  insert into public.wallets (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- TRIGGER: auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated before update on public.profiles for each row execute procedure public.handle_updated_at();

drop trigger if exists on_wallets_updated on public.wallets;
create trigger on_wallets_updated before update on public.wallets for each row execute procedure public.handle_updated_at();

drop trigger if exists on_expenses_updated on public.expenses;
create trigger on_expenses_updated before update on public.expenses for each row execute procedure public.handle_updated_at();