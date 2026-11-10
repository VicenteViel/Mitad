# Rumi

**Shared expenses, clearer balances, and better household organization.**

Rumi is a cross-platform mobile application for Android and iOS, designed for roommates, couples, families, and other groups that share expenses. The app focuses on transparent expense tracking and simple debt settlement without handling money transfers.

> **Status:** Active development. The shared-expenses MVP is implemented, but the application has not been publicly released. Household chores and subscriptions are planned.

## What it does

- Create and manage shared groups with different member roles.
- Invite members using links, codes, or QR-based flows.
- Record expenses and split them equally or by custom amounts.
- Calculate balances and track who owes whom.
- Record settlements without processing payments.
- Attach supporting images to expenses and settlements.
- Keep a history of expenses and transactions.

Some product flows require further testing before a public beta.

## Tech stack

| Area | Technologies |
| --- | --- |
| Mobile | React Native, Expo, Expo Router |
| Language | TypeScript |
| Backend | Supabase, PostgreSQL, Supabase Auth |
| Data fetching | TanStack Query |
| Testing | Jest, Jest Expo |
| Quality | ESLint, TypeScript, GitHub Actions |

## Engineering considerations

- **Financial correctness:** Values are stored as integer Chilean pesos to avoid floating-point rounding issues.
- **Access control:** Role-aware operations and database-level access policies.
- **Consistency:** The design uses PostgreSQL functions and idempotency for sensitive operations.
- **Maintainability:** Feature-based modules separate authentication, groups, expenses, balances, and invitations.
- **Quality gates:** Pull requests run linting, type checking, and automated tests.

## Repository structure

```text
src/
  app/          # Expo Router screens and navigation
  components/   # Shared UI
  features/     # Domain features
  lib/          # Shared utilities
  theme/        # Visual design
supabase/       # Database and backend configuration
docs/           # Product and technical documentation
```

## Run locally

You will need Node.js, npm, and a Supabase project configured for the app.

```bash
git clone https://github.com/VicenteViel/Rumi.git
cd Rumi
npm ci
npm start
```

To run the quality checks:

```bash
npm run verificar
```

Supabase credentials and project configuration are required for backend features. Do not commit local secrets.

## Roadmap

- [x] Shared-expenses MVP: groups, invitations, expenses, balances, and settlements
- [x] Automated checks for the existing codebase
- [ ] Beta readiness and end-to-end testing
- [ ] Household chore management ("Hoy Te Toca")
- [ ] Premium subscriptions
- [ ] App Store and Google Play releases

For more details, see the [project documentation](docs/README.md) and [architectural decisions](docs/decisiones.md).

---

**Built by [Vicente Viel](https://github.com/VicenteViel).**
