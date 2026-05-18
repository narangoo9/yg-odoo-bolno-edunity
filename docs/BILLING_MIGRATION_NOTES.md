# Billing migration notes

## Plan mapping (existing DB rows)

| Old value | New value |
|-----------|-----------|
| FREE, BASIC, STUDENT | STANDARD |
| PREMIUM | PREMIUM |
| PRO | PRO |
| ENTERPRISE, INSTRUCTOR, ORGANIZATION | PRO |

Run migration:

```bash
npx prisma migrate deploy
# or locally:
npx prisma migrate dev
```

SQL: `prisma/migrations/20260518120000_billing_plan_standardization/migration.sql`

## Application behavior

- New users without a subscription row are treated as **STANDARD** via `normalizePlanId()`.
- Stripe checkout is only created for `planId` **PREMIUM** or **PRO**.
- Plan tier after payment is determined from **Stripe price ID**, not client metadata.

## Stripe

Create new monthly prices in MNT:

- Premium: ₮9,900
- Pro: ₮19,900

Set in environment:

```
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
```

Deprecate old 29900/79900 price IDs in Stripe dashboard (archive, do not delete if active subscribers exist).

## Seed demo users

| Email | Plan | Password |
|-------|------|----------|
| student@elearn.mn | STANDARD | Student@1234 |
| premium@elearn.mn | PREMIUM | Student@1234 |
| pro@elearn.mn | PRO | Student@1234 |

```bash
npm run db:seed
```
