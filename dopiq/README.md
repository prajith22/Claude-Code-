# Dopiq

Dopamine without the damage. A Next.js 14 app that simulates shopping, food
delivery, and sports betting with fake money.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (light theme only)
- Prisma + PostgreSQL (Supabase)
- NextAuth.js (Google Gmail sign-in)
- Stripe Checkout ($3.99/month, 30-day trial) + webhook
- Framer Motion + canvas-confetti
- Zustand for cart state

## Getting started

```bash
cp .env.example .env
# Fill DATABASE_URL / DIRECT_URL (Supabase), NEXTAUTH_SECRET, Google, Stripe
npm install
npx prisma db push
npm run dev
```

Stripe webhook (local):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Structure

```
app/             Next.js App Router pages (+ API routes)
  (app)/         Gated main shell: /home, /shop, /food, /bet
  paywall/       Trial-expired paywall
  signin/        Google-only sign-in
  api/           NextAuth, Stripe, bets
components/      Shared UI (nav, cards, forms, animations)
data/            Hardcoded products, restaurants, games
lib/             prisma, auth, stripe, utils, guards, cart store
prisma/          schema.prisma (User, Account, Session, OddsCache)
types/           Shared TS types + next-auth module augmentation
```

## Notes

- Everything in Shop / Food / Bet is simulated — no real money, no real
  brands. The only real-money touchpoint is the $3.99/mo subscription.
