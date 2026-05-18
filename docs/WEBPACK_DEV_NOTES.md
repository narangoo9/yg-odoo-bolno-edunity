# Webpack dev warnings (harmless)

## OpenTelemetry / Prisma instrumentation

```
Critical dependency: the request of a dependency is an expression
Import trace: @prisma/instrumentation → @sentry/nextjs
```

**Cause:** Sentry’s Prisma tracing pulls in OpenTelemetry, which uses dynamic `require()` for optional platform modules.

**Impact:** Dev-only webpack warning. Does not affect runtime or production builds.

**Mitigation:** `next.config.ts` ignores this warning in development. Sentry webpack wrapper is disabled outside production (`NODE_ENV !== "production"`).
