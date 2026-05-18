# API Authorization Audit

**Base commit:** `7bae316` (production safety)  
**Date:** 2026-05-18  
**Scope:** `src/app/api/**/route.ts` (44 routes)

## Context

Middleware (`src/middleware.ts`) **does not protect `/api/*`**. Each route must enforce auth itself.

## Helpers added

- `src/lib/api/session.ts` — `requireSession()`, `requireRoles()`

## Fixes applied

| Route | Issue | Fix |
|-------|--------|-----|
| `POST /api/v1/gamification/xp` | Any user could award arbitrary XP | Endpoint returns 403; XP is server-only |
| `POST /api/v1/learning/task-state` | Client could set `completed` | Only `not-started` / `draft` allowed |
| `GET /api/v1/certificates/verify/[code]` | Exposed student email | Public response redacted (no email) |
| `POST /api/v1/gamification/daily-challenge` | Replay old challenge IDs | POST requires challenge `date === today` (UTC) |
| `POST /api/ai-agent` | Fail-open rate limit, anonymous abuse | `sensitiveRateLimit` (fail-closed in prod) |

## Route classification (summary)

| Auth | Routes |
|------|--------|
| **Public (intentional)** | `health`, `auth/*`, `webhooks/stripe`, `courses` GET catalog, `courses/[id]` GET (published), `certificates/verify`, `saved-courses` (empty if anon), `ai-agent` (rate-limited) |
| **Protected** | All `v1/*` user data, learning, payments, uploads, AI `/api/ai/agent`, socket-token |
| **Role-gated** | `analytics` (SUPER_ADMIN), course POST (instructor/org admin) |

## Well-secured patterns (keep)

- `lessons/[id]` — enrollment or manage-role before content
- `payments/subscribe/confirm` — `checkoutUserId === session.user.id`
- `todos`, `notes` — `userId` scoped CRUD
- `task-submit`, `watch-progress` — enrollment + section in course

## Remaining recommendations

| Priority | Item |
|----------|------|
| Medium | Require auth for LLM-heavy `ai-agent` paths (keep rule-based fallback public if needed) |
| Medium | Gate `section-complete` on minimum watch time from `watch-progress` |
| Low | Restrict `GET /api/health` in production (minimal payload or internal token) |
| Low | Shared `requireEnrollment(courseId)` helper for learning routes |
