# Billing QA checklist

## Standard (free)

- [ ] New user effective plan is Standard
- [ ] Standard does not open Stripe checkout
- [ ] Free / intro course content accessible
- [ ] Premium-only course shows upgrade CTA
- [ ] Settings show Standard + Active/Free state

## Premium (₮9,900)

- [ ] Checkout uses `STRIPE_PREMIUM_PRICE_ID`
- [ ] Webhook upgrades user to PREMIUM
- [ ] Premium course access works
- [ ] Peer review / certificate download (per feature flags)
- [ ] Settings show Premium + renewal date

## Pro (₮19,900)

- [ ] Checkout uses `STRIPE_PRO_PRICE_ID`
- [ ] Pro user has Premium + Pro features
- [ ] Advanced AI / career tools gated to Pro
- [ ] Settings show Pro

## Stripe webhooks

- [ ] Invalid signature → 400
- [ ] `checkout.session.completed` upgrades correct user
- [ ] `invoice.payment_failed` → PAST_DUE + user message
- [ ] `customer.subscription.deleted` → downgrade path
- [ ] Duplicate event id → no double update

## UI

- [ ] No ₮29,900 or ₮79,900 in UI
- [ ] Landing + /pricing + /student/upgrade show 0 / 9900 / 19900
- [ ] Premium card highlighted (Most Popular)
- [ ] Mobile + dark mode OK

## Commands

```bash
npm run typecheck
npm run lint
npx prisma validate
npm run build
```
