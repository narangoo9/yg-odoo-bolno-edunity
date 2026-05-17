# Production Checklist

Run these before launch and before every production deploy.

## Build checks

```bash
npm ci
npm run typecheck
npm run lint
npm run build
npx prisma validate
npx prisma migrate deploy
```

## Product flow checks

- Register flow
- Email verification flow
- Login flow
- Google OAuth flow
- Course enrollment
- Lesson watch
- YouTube lesson task submission after video completion
- Peer review grading
- Realtime chat without refresh
- Certificate generation
- Payment flow
- Admin permission checks
- Company permission checks
- Instructor permission checks

## Security checks

- Confirm `AUTH_SECRET` is set and matches the socket server.
- Confirm `DATABASE_URL` uses the pooled app connection.
- Confirm `DIRECT_URL` uses the direct migration connection.
- Confirm Redis is configured in production.
- Confirm Stripe webhook signing is enabled and `STRIPE_WEBHOOK_SECRET` is set.
- Confirm public API endpoints are intentionally public and private API endpoints validate session, role, and resource access.
