# Performance Audit

**Base commit:** `7bae316`  
**Focus areas:** dashboard, leaderboard, instructor, lesson player, admin users, course detail

## Fixes applied

| Area | Change |
|------|--------|
| **Instructor dashboard** | `getInstructorCourseStats` uses `groupBy` instead of loading all reviews/enrollments |

## Existing optimizations (7bae316)

- Admin analytics: `unstable_cache` (60s)
- Leaderboard: cached global/weekly queries (30s)
- Dashboard user: `getCachedDashboardUser()`
- Admin users: pagination (20/page)
- Sentry disabled in dev builds

## Remaining recommendations

| Area | Recommendation |
|------|----------------|
| **Learn page** | Slim Prisma include; load completions separately |
| **Leaderboard** | Avoid referral `update` on read; lazy-load tab data |
| **Course detail** | Remove `force-dynamic` if safe; cache `getCourseBySlug` |
| **Dashboard layout** | Pass user snapshot to `RightSidebar` (avoid duplicate `findUnique`) |
| **trackLessonView** | Debounce / `useEffect` once per lesson (not every RSC render) |

## Client bundle

- `RoboAgent` dynamically imported in dashboard layout
- Consider splitting `LeaderboardClient` subcomponents
