# EduNity Billing Audit (2026-05-18)

## Canonical plans (post-refactor)

| Plan | Price | Role |
|------|-------|------|
| Standard | Үнэгүй | New users |
| Premium | ₮9,900 / month | Main conversion |
| Pro | ₮19,900 / month | Advanced users |

**SSOT:** `src/lib/billing/plans.ts`

## Old values removed

- ₮29,900 / ₮79,900 (were in `src/lib/pricing/billing-plans.ts`)
- Yearly toggle pricing (299000 / 799000 MNT)
- App logic mapping PREMIUM → STANDARD (incorrect)

## Files with billing / pricing logic

### Core config
- `src/lib/billing/plans.ts` — **canonical** plan definitions + feature gates
- `src/lib/pricing/billing-plans.ts` — UI adapter (re-exports SSOT)
- `src/lib/subscription/plans.ts` — deprecated re-exports
- `src/lib/subscription-access.ts` — course access helpers
- `src/lib/marketplace-access.ts` — lesson/section gating
- `src/lib/stripe/plan-prices.ts` — Stripe price ID mapping
- `src/lib/stripe/subscription-sync.ts` — webhook DB sync
- `src/lib/env.ts` — Stripe env vars

### API routes
- `src/app/api/v1/payments/subscribe/route.ts` — checkout (planId only)
- `src/app/api/v1/payments/subscribe/confirm/route.ts`
- `src/app/api/v1/payments/cancel/route.ts`
- `src/app/api/v1/payments/checkout/route.ts` — per-course (unchanged)
- `src/app/api/webhooks/stripe/route.ts`

### UI
- `src/app/(public)/pricing/PricingClient.tsx`
- `src/app/(dashboard)/student/upgrade/page.tsx`
- `src/components/student/UpgradeClient.tsx`
- `src/components/student/SubscriptionSection.tsx`
- `src/app/page.tsx` — landing pricing section
- `src/components/marketplace/UpgradeModal.tsx`
- `src/components/course/CoursePremiumBanner.tsx`
- `src/components/course/YouTubeCoursePlayer.tsx`

### Database
- `prisma/schema.prisma` — `SubscriptionPlan` enum, `Subscription` model
- `prisma/migrations/20260518120000_billing_plan_standardization/migration.sql`
- `prisma/seed.ts` — demo STANDARD / PREMIUM / PRO users

### Admin / legacy
- `src/app/(dashboard)/admin/subscriptions/page.tsx` — still lists legacy org plans
- `src/modules/subscriptions/domain/schemas.ts` — legacy FREE schema

### Scripts / docs
- `scripts/setup-stripe.mjs`
- `.env.example`
- `docs/BILLING_MIGRATION_NOTES.md`
- `docs/BILLING_QA_CHECKLIST.md`

## Stripe env (required for paid checkout)

```
STRIPE_PREMIUM_PRICE_ID=
STRIPE_PRO_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
```

Legacy fallbacks: `STRIPE_PREMIUM_MONTHLY_PRICE_ID`, `STRIPE_PRO_MONTHLY_PRICE_ID`

## Inconsistencies addressed

- Duplicate plan sources (`billing-plans.ts` vs `subscription/plans.ts`) → unified
- Wrong prices 29900/79900 → 9900/19900
- FREE used as default → STANDARD
- Client sent `billing: yearly` → monthly only
- Checkout trusted `plan` string → `planId` + server price map
