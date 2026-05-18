# Stripe Production Audit

**Base commit:** `7bae316`  
**Files:** `src/app/api/webhooks/stripe/route.ts`, `src/lib/stripe/*`, payment API routes

## Fixes applied

| Control | Implementation |
|---------|----------------|
| **Webhook idempotency** | `stripe_webhook_events` table + `claimStripeWebhookEvent()` |
| **User binding** | Reject checkout when `client_reference_id !== metadata.userId` |
| **Payment status** | Skip fulfillment unless `payment_status === paid` |
| **Order amount** | Compare `session.amount_total` to `order.finalAmount` |
| **Course price** | Legacy `course_purchase` validates paid amount vs DB price |
| **Duplicate payment** | Skip if `stripePaymentId` already exists |
| **Plan tier** | `syncStripeSubscription` uses Stripe price ID only (not metadata plan) |
| **Subscription cancel** | DB sets `cancelAtPeriodEnd`; status stays ACTIVE until webhook |
| **Subscription updated** | Uses `syncStripeSubscription` for consistency |

## Migration

`prisma/migrations/20260518000000_stripe_webhook_events`

Deploy: `npx prisma migrate deploy`

## Already strong

- Signature verification (`constructEvent` on raw body)
- Checkout creation reads DB price (`payments/checkout`)
- Subscribe uses server-side `PRICE_MAP` from env
- `subscribe/confirm` checks session user matches metadata

## Remaining recommendations

| Priority | Item |
|----------|------|
| Medium | Unify fulfillment in one function for `checkout.session.completed` + `payment_intent.succeeded` |
| Medium | Create `Order` record for all course checkouts (not only metadata `course_purchase`) |
| Low | Return 200 after logging for non-retryable handler errors (with idempotency) |
