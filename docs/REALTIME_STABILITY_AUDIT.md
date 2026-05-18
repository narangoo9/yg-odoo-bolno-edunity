# Realtime Stability Audit

**Base commit:** `7bae316`  
**Files:** `socket-server/server.ts`, `src/lib/socket.ts`, `src/components/lesson/LessonChat.tsx`

## Fixes applied

| Issue | Fix |
|-------|-----|
| `connect_error` listener leak | Named handler + `socket.off("connect_error", handler)` |
| Stale socket JWT (15m) | Refresh token on unauthorized `connect_error` |
| Excessive `typing:start` | Emit once per typing session until stop |
| Repeated DB access on join/send | `getCachedLessonAccess()` per socket |

## Socket server (existing from 7bae316)

- JWT auth on connection
- `assertLessonAccess` before join/send
- Rate limit 800ms per user on messages
- Redis adapter optional for scale

## Remaining recommendations

| Priority | Item |
|----------|------|
| Medium | Keep `LessonChat` mounted when toggling chat in `LearningPlayer` (avoid re-join) |
| Medium | Multi-instance: move `roomUsers` to Redis sets for accurate online counts |
| Low | Add `polling` transport fallback in `src/lib/socket.ts` |

## Supabase chat (`MessagesClient`)

- Fixed `mapSupabaseMessage` in `useEffect` dependency array
- RLS + conversation membership required
