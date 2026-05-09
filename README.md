# SplitMate 💰

> Hostel finance tracker — manage your money, split expenses with friends, settle debts.

## Features

- **Wallet** — Track money received from home. See what you own vs what's actually available.
- **Expenses** — Log every spend. Solo or split with friends (equal or custom amounts).
- **Debts** — Automatically calculated from splits. See exactly who owes you and what you owe.
- **Friends** — Add hostel mates, send/accept friend requests.
- **Dashboard** — Net balance, spend by category, recent activity.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Charts | Recharts |
| Deployment | Vercel (frontend) + Supabase (backend) |

---

## Setup Guide

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (choose a region close to you — Singapore works well)
3. Wait for the project to spin up (~2 minutes)

### 2. Set up the database

1. In your Supabase dashboard, click **SQL Editor**
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run** — this creates all tables, policies, and triggers

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your values from Supabase Dashboard → Settings → API:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploying to Vercel

1. Push this project to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → Import → select your repo
3. Add environment variables (same as `.env.local`)
4. Click Deploy

Your app will be live at `https://your-app.vercel.app` — share with your friends!

---

## Project Structure

```
src/
├── components/
│   ├── ui/          # Button, Input, Card, Modal, Badge, Avatar, etc.
│   └── layout/      # Sidebar, BottomNav
├── pages/
│   ├── AuthPage.tsx
│   ├── DashboardPage.tsx
│   ├── WalletPage.tsx
│   ├── ExpensesPage.tsx
│   ├── DebtsPage.tsx
│   └── FriendsPage.tsx
├── store/
│   ├── authStore.ts   # Zustand auth state + Supabase auth
│   └── appStore.ts    # Wallet, expenses, debts, friends
├── lib/
│   └── supabase.ts    # Supabase client
└── types/
    └── index.ts       # All TypeScript types
supabase/
└── schema.sql         # Full database schema with RLS
```

---

## How the Money Math Works

| Term | Definition |
|---|---|
| **Total Owned** | All money you've ever added to your wallet |
| **Total Spent** | Your personal share of all expenses |
| **Currently Available** | Total Owned − Total Spent |
| **Owed to You** | Unsettled splits where you paid |
| **You Owe** | Unsettled splits where someone else paid |
| **Net Balance** | Currently Available + Owed to You − You Owe |

---

## Phase 2 (Coming Soon)

- [ ] Push notifications for new debts
- [ ] Group trips (create a trip, all expenses within it)
- [ ] Expense photos / receipts
- [ ] Monthly spending reports
- [ ] PWA (install on phone like an app)
- [ ] Debt simplification (A owes B, B owes C → A owes C directly)

---

## License

MIT — build on it, improve it, share it with your hostel.