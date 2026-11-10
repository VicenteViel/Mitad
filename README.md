# Rumi

**Share expenses. Share responsibilities.**

Rumi is a mobile app for Android and iOS that helps people who live together keep their shared money clear. Couples, families, friends and roommates use it to log what each person paid, split it fairly, and see at a glance who owes whom.

In the app, group members are called **rumis** (from *roomie*).

> **Status:** Phase 1 (expense management) is implemented and covered by automated checks. The household-tasks module and subscriptions are next. The app is not yet published on the stores.

---

## What it does

### Expense management (free)

- **Groups and members.** Create a group, add members by name, and invite them when they are ready. A member who never installs the app (for example, a grandparent without a smartphone) can still be part of the group; an admin records their money for them.
- **Invitations.** Each pending member gets a single-use, 7-day invitation with a 10-character code, a QR code and a shareable link. Invitations can be revoked and can re-link a member who lost their phone.
- **Sign-in without friction.** Email + one-time code (OTP). People who join through an invitation can start without an email and add one later, keeping their account and groups.
- **Expenses.** Log an expense with a category, the payer and the participants. Split it equally or with custom amounts that must add up exactly.
- **Receipts.** Attach photos of receipts or transfer screenshots to expenses and payments. Files live in a private bucket and are shown through temporary links.
- **Balances.** Debts are computed per pair of members and netted within each pair, so everyone sees exactly who owes whom.
- **Payments between rumis.** Record settlements; the app suggests the exact amount owed.
- **Due dates and monthly expenses.** Expenses can have a deadline, recurring monthly expenses are supported, and overdue items are highlighted.
- **Full history.** A filterable log of every expense and payment, including who edited what and when.
- **Roles.** Groups can have several admins. Everyone logs expenses; only admins edit or delete them.
- **Account deletion.** Deleting an account anonymizes the member ("Ex-rumi") so the group keeps its history and balances.

### Hoy Te Toca — household tasks (Pro, planned)

A premium module to share chores: one-off and recurring tasks, automatic rotation, a shared calendar, reminders and a completion history. Planned as a single subscription per household, not per user.

---

## How money is handled

- Amounts are Chilean pesos stored as **integers**. No floating point.
- When an equal split doesn't divide evenly, the leftover pesos are assigned by a fixed, documented rule, so totals always match.
- **Balances are never stored.** They are derived from expenses, splits and settlements.
- Every money operation is a **Postgres function (RPC)**: atomic, and protected by an idempotency key so retries never create duplicates.
- Deletions are logical and record who did them and when.
- Rumi never connects to bank accounts or moves real money.

## Security

- **Row Level Security** on every table: a user only reads and writes data from groups they belong to.
- Permission checks for admin-only actions live in the database, not just in the UI.
- Receipts are stored in a private Supabase Storage bucket with size and file-type limits.
- Account deletion runs in a Supabase Edge Function.

---

## Tech stack

| Technology | Purpose |
|---|---|
| React Native + Expo | Cross-platform mobile app (Android and iOS) |
| TypeScript | Static typing across app and tests |
| Expo Router | File-based navigation with typed routes |
| TanStack Query | Server state, caching and mutations |
| React Native Reanimated | Animations |
| Supabase | Auth (OTP and anonymous sessions), Postgres, Storage, Edge Functions |
| PostgreSQL | Data model, RLS policies and transactional RPC functions |
| Jest | Unit tests for money logic and permissions |
| GitHub Actions | Lint, type check and tests on every pull request |

## Project structure

```
src/
  app/            Screens and routes (Expo Router)
  components/     Shared UI components
  features/       Feature modules: grupos, gastos, saldos, invitaciones, cuenta
  lib/            Supabase client and generated database types
supabase/
  migrations/     Database schema, RLS policies and RPC functions
  functions/      Edge Functions
docs/             Product decisions and data model (Spanish)
```

The code is organized by feature. Business rules (splits, balances, permissions) live in plain TypeScript functions that are tested independently of the UI.

---

## Getting started

Requirements: Node.js 22, npm, and a Supabase project.

```bash
npm install
```

Create `.env.local` with your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Run the app:

```bash
npm start
```

Run all checks (lint, TypeScript and tests):

```bash
npm run verificar
```

---

## Roadmap

**Phase 1 — Expense management** ✅
Auth, groups, invitations, expenses, splits, balances, settlements, receipts, history, due dates, CI.

**Phase 2 — Hoy Te Toca**
Chores, recurring tasks, rotation, shared calendar, notifications.

**Phase 3 — Launch**
Subscriptions per household, closed beta, Google Play and App Store release.

---

## Documentation

Product decisions and the data model are documented (in Spanish) in [`docs/`](docs/).

## License

License to be defined.
