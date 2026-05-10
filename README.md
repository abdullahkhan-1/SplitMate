# SplitMate

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38BDF8?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel)

💸 Hostel expense tracker — add funds, split bills, and settle debts with your friends in real time.

---

## The Problem

Living in a hostel means constant shared expenses — food runs, grocery trips, medicine, transport. Money gets messy fast:

- You forget who paid for what last week
- Friends forget they owe you for that dinner
- Nobody knows how much of your money is actually spent vs lent out
- Settling up becomes awkward because no one remembers exact amounts

**SplitMate solves this.** Every rupee you receive, spend, or split is tracked — so you always know your real financial position, and settling up is one tap away.

---

## Features

- 💰 **Wallet tracking** — log money received from home, track your full balance history
- 📊 **Dual balance view** — see *Total Owned* (all received) vs *Currently Available* (after spending) vs *Net Balance* (including what friends owe you)
- 🧾 **Expense logging** — categorize every expense across food, transport, groceries, medicine, entertainment, and utilities
- ✂️ **Three split modes** — solo (just you), equal split (auto-divided), or custom (assign different amounts per person manually)
- 🤝 **Auto debt tracking** — debts are calculated from splits automatically, no manual entry ever
- ✅ **Settle up** — mark debts as paid in one click, balances update instantly across all users
- 👥 **Friends system** — add friends by username, send and accept friend requests
- 📈 **Dashboard** — monthly spending chart by category, net balance overview, recent expenses, and outstanding debts all at a glance
- 🔒 **Per-user data isolation** — Row Level Security ensures no user can access another's wallet or expenses

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + TypeScript | Component-based UI with full type safety |
| Build Tool | Vite | Fast dev server and optimized production builds |
| Styling | Tailwind CSS | Utility-first responsive design |
| State | Zustand | Lightweight global state, no boilerplate |
| Backend | Supabase (PostgreSQL) | Database, auth, real-time, and row-level security |
| Charts | Recharts | Spending breakdown bar charts |
| Icons | Lucide React | Clean consistent icon set |
| Routing | React Router v6 | Client-side navigation with auth guards |
| Deployment | Vercel + Supabase | Free tier, production-ready |

---

## Database Schema

```
profiles             — user info (username, full name, avatar)
wallets              — running balance totals per user
wallet_transactions  — every fund addition with amount and description
expenses             — each expense with title, amount, category, split type
expense_splits       — individual share amounts per person per expense
friends              — friend relationships and pending requests
settlements          — records of settled debt payments
```

All tables have **Row Level Security (RLS)** enabled — users can only read and write their own data.

---

## Project Structure

```
splitmate/
├── public/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── AuthPage.tsx          # Login & register
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx     # Home: summary cards + spending chart
│   │   ├── wallet/
│   │   │   └── WalletPage.tsx        # Add funds, balance breakdown, history
│   │   ├── expenses/
│   │   │   └── ExpensesPage.tsx      # Log expenses, choose split type
│   │   ├── debts/
│   │   │   └── DebtsPage.tsx         # Who owes who, settle up flow
│   │   ├── friends/
│   │   │   └── FriendsPage.tsx       # Search users, send/accept requests
│   │   ├── layout/
│   │   │   └── Sidebar.tsx           # Navigation sidebar + mobile bottom nav
│   │   └── ui/
│   │       └── index.tsx             # Button, Card, Input, Modal, Badge, Avatar
│   ├── store/
│   │   ├── authStore.ts              # Session, login, register, logout
│   │   └── appStore.ts               # Wallet, expenses, debts, friends state
│   ├── lib/
│   │   └── supabase.ts               # Supabase client initialisation
│   ├── types/
│   │   └── index.ts                  # All TypeScript interfaces matching DB schema
│   ├── App.tsx                       # Root with routing + auth guard
│   ├── main.tsx                      # Entry point
│   └── index.css                     # Global styles + Tailwind directives
├── supabase/
│   └── schema.sql                    # Full DB schema — run once in Supabase SQL Editor
├── .env                              # Your secret keys (never commit)
├── .env.example                      # Keys template
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/splitmate.git
cd splitmate
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com) (free)
2. Click **New Project** → name it `splitmate` → choose a region
3. Wait ~2 minutes for it to initialize

### 4. Run the database schema

1. In Supabase → **SQL Editor** → **New Query**
2. Paste the full contents of `supabase/schema.sql`
3. Click **Run** — you should see *Success. No rows returned.*

### 5. Disable email confirmation (development)

Supabase → **Authentication** → **Email** → turn off **Enable email confirmations** → Save

### 6. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
```

Find these at Supabase → **Settings** → **API Keys** → copy the **Project URL** and **Publishable key**.

### 7. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## How to Use

### Register and set up your wallet

1. Open the app and click **Register**
2. Enter your full name, a unique username, email, and password
3. You're taken to the **Dashboard** — your wallet starts at Rs 0

### Add money to your wallet

1. Go to **My Wallet** → click **Add Funds**
2. Enter the amount and an optional note (e.g. *"From home — May"*)
3. Your **Total Owned**, **Available**, and **Net Balance** all update instantly

### Log an expense

1. Go to **Expenses** → click **Add Expense**
2. Fill in the title, amount, and category
3. Choose a split type:
   - **Solo** — you paid for yourself only, no one else involved
   - **Equal split** — select friends, the amount is divided equally among everyone
   - **Custom split** — manually assign how much each person owes
4. Save — the expense is logged and debts are auto-calculated

### Settle a debt

1. Go to **Debts**
2. *Owed to You* shows what friends owe you — click **Settle** when they pay you back
3. *You Owe* shows what you owe friends — click **Settle** when you've paid them
4. Balances update across everyone's accounts immediately

### Add friends

1. Go to **Friends** → search by username or full name
2. Click **Add** to send a friend request
3. Your friend logs in, goes to **Friends**, and accepts
4. You can now include them in split expenses

---

## Deployment

Both Vercel and Supabase have free tiers sufficient for personal and small group use.

### Deploy to Vercel

1. Push your project to GitHub (ensure `.env` is in `.gitignore`)
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Add environment variables in Vercel's project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy** — live in ~60 seconds

Share the Vercel URL with your friends. They register, add you by username, and you're ready to split.

---

## Balance Logic

SplitMate tracks three distinct numbers that are often confused:

| Term | Meaning |
|---|---|
| **Total Owned** | Every rupee ever received — never decreases |
| **Currently Available** | Total Owned minus what you've actually spent yourself |
| **Net Balance** | Available + what friends owe you − what you owe friends |

**Example:** You receive Rs 8,000. You pay for a Rs 2,000 dinner that you split equally with a friend (each owes Rs 1,000). You spent Rs 1,000 of your own money and your friend owes you Rs 1,000.

- Total Owned → Rs 8,000
- Currently Available → Rs 7,000 (8,000 − 1,000 your share)
- Net Balance → Rs 8,000 (7,000 + 1,000 owed to you)

---

## Roadmap

- [ ] Push notifications when a debt is settled
- [ ] Group trips with a shared pooled budget
- [ ] Export expenses to CSV
- [ ] Recurring monthly expenses (rent, utilities)
- [ ] Receipt photo upload
- [ ] PWA support — installable on mobile home screen
- [ ] Dark mode toggle

---

## License

MIT — free to use, fork, and build on.

---

Built to solve a real problem in hostel life. 🏠