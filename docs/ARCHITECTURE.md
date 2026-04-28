# ELearn — Архитектур ба Дизайн

Энэ бичиг төслийн техник архитектур, шийдвэрлэсэн асуудал, дизайны зарчмуудыг тайлбарлана.

---

## 1. Архитектурын хандлага

### 1.1 Modular Monolith (initial state)

Төслийг эхний үе шатанд **Modular Monolith** хэлбэрээр хөгжүүлсэн бөгөөд шаардлагын хэмжээнд **microservices** руу шилжих боломжтой бүтэцтэй.

**Шалтгаан:**
- Microservices хэт төвөгтэй, infrastructure overhead ихтэй
- Modular boundary нь ирээдүйд салгах боломжийг нээлттэй үлдээж байна
- Хөгжүүлэлт болон deployment-ыг хялбар болгож байна

### 1.2 Clean Architecture — 4 давхрага

```
┌──────────────────────────────────────────────────────┐
│   Presentation Layer                                 │
│   - React components, pages, forms, layouts          │
│   - API route handlers                               │
│   - Input validation                                 │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│   Application Layer                                  │
│   - Server Actions (use cases)                       │
│   - Business orchestration                           │
│   - createCourse, enrollStudent, markComplete...    │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│   Domain Layer                                       │
│   - Zod schemas, types                               │
│   - Business rules (canEnroll, canManageCourse)     │
│   - Entity validation                                │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│   Infrastructure Layer                               │
│   - Prisma (database)                                │
│   - Stripe (payments)                                │
│   - Cloudinary (storage)                             │
│   - BullMQ + Redis (queue)                           │
│   - Nodemailer (email)                               │
└──────────────────────────────────────────────────────┘
```

Layer хоорондын dependency нь зөвхөн **дээрээс доош** чиглэнэ.

---

## 2. Модулийн бүтэц

Module бүр өөрийн `domain`, `application`, `infrastructure` дэд-folder-тэй:

```
modules/courses/
├── domain/           # schemas.ts — Zod validation, types
├── application/      # actions.ts — server actions / use cases
└── infrastructure/   # queries.ts — Prisma query functions
```

### Яагаад Server Actions?
Next.js 15 App Router дээрх Server Actions нь:
- Type-safe (client болон server талд ижил)
- Form submission рүү шууд холбогдоно
- Revalidation автоматаар хийгддэг
- REST API өөр давхраагаар нэмж байна

**API Layer** (`/api/v1/*`) нь гадны integration-д зориулсан — web UI дотроос ихэвчлэн Server Actions ашиглана.

---

## 3. Multi-Tenancy

### 3.1 Аргачлал: **Shared database, shared schema, isolated by organizationId**

Бүх курс, хэрэглэгч, enrollment нь `organizationId` field-тэй. Query бүрд org context-ыг автоматаар холбоно.

**Давуу тал:**
- Нэг database, нэг schema → хялбар maintain
- Cost-effective (олон tenant нэг DB instance ашиглана)
- Backup, migration хялбар

**Сул тал:**
- Data isolation application layer-д тулгуурлана (bug үүсэх боломжтой)
- Асар том tenant (10M+ records) гарвал performance асуудал байж болно

### 3.2 Tenant-aware queries

Instructor query-нд `organizationId` scope:

```ts
where: {
  instructorId: session.user.id,
  organizationId: session.user.organizationId, // tenant scope
}
```

---

## 4. Authentication & Authorization

### 4.1 Auth: **NextAuth v5 + JWT**

- JWT session (stateless, scalable)
- Credentials + Google OAuth
- bcrypt (cost=12) нууц үг hash

### 4.2 RBAC — 4 role

```
SUPER_ADMIN (3) > ORG_ADMIN (2) > INSTRUCTOR (1) > STUDENT (0)
```

`hasRole()` helper болон `canManageCourse()` policy функцууд бизнес-лайн эрхийг шийдвэрлэнэ.

### 4.3 Route protection — 3 давхрага

1. **Middleware** (`src/middleware.ts`) — Route-level
2. **Server Action** — Business logic дотор `auth()` + role check
3. **API Route** — `auth()` + explicit 403 response

---

## 5. Database Design Decisions

### 5.1 PostgreSQL + Prisma

**Яагаад PostgreSQL:**
- JSONB support (flexible settings, metadata)
- Full-text search built-in
- Strong consistency guarantees
- Scalable to 10M+ rows

**Яагаад Prisma:**
- Type-safe query builder
- Migration автомат
- Schema-first approach

### 5.2 Key indexing decisions

- `@@unique([studentId, courseId])` — enrollment давхцалтгүй
- `@@unique([studentId, lessonId])` — progress нь хичээл бүрт 1 бичлэг
- `verificationCode @unique` — public verification-д ашиглана
- `slug @unique` — SEO-friendly URL

### 5.3 Soft delete pattern

User `status: "SUSPENDED"` ашиглаж soft delete хийнэ — бүх связь өгөгдөл хадгалагдана.

Course `status: "ARCHIVED"` — мөн адил.

---

## 6. Background Jobs (BullMQ + Redis)

### 6.1 Queue architecture

```
Main App   ──►  Redis (queue)  ──►  Worker process
    │                                    │
    │                                    ├─ email sending
    │                                    ├─ PDF certificate generation
    │                                    └─ reminder scheduling
    │
    └─ Cache (Redis)
```

**Тусдаа worker process** ажиллуулах нь:
- Main app ачаалал багасгана
- Scale independently боломжтой
- Job failure нь UX-ийг эвддэггүй

### 6.2 Job types

| Queue         | Use case                         | Priority |
|---------------|----------------------------------|----------|
| `email`       | All transactional emails         | High     |
| `certificate` | PDF generation + upload to CDN   | Medium   |
| `reminder`    | Scheduled notifications          | Low      |
| `analytics`   | Aggregate metrics                | Low      |

---

## 7. Caching Strategy

### 7.1 Redis caching layers

1. **Query cache** — Expensive aggregate queries (top courses, analytics)
2. **Session cache** — NextAuth JWT (stateless, no cache needed)
3. **Rate limit cache** — ZSET-based sliding window

### 7.2 Cache invalidation

On write operations:
```ts
await db.course.update(...);
await invalidateCache("courses:*");
```

---

## 8. Performance Optimizations

### 8.1 Database-level

- Pagination хэтэрхий их record query-г хязгаарлана
- `select` clause унших хэмжээг багасгана
- `include._count` aggregation query-г хэмнэнэ
- Composite indexes hot path-уудад

### 8.2 Next.js-level

- Server Components default (client JS багасгана)
- Streaming SSR (Suspense boundaries)
- Image optimization (`next/image`)
- Static generation public хуудсанд

### 8.3 CDN-level

- Nginx + Cloudinary image CDN
- Static assets 1 жилийн cache
- Gzip compression
- HTTP/2

---

## 9. Error Handling

### 9.1 API layer

Standardized response format:
```json
{ "success": true, "data": {...} }
{ "success": false, "error": "...", "details": {...} }
```

### 9.2 Server Actions

Return error object instead of throw:
```ts
{ error: "..." } | { success: true, data: ... }
```

Client-side: display via `toast()`.

---

## 10. Security

| Layer       | Protection                                        |
|-------------|---------------------------------------------------|
| Transport   | HTTPS (Nginx + Let's Encrypt)                     |
| Password    | bcrypt (cost=12)                                  |
| Sessions    | JWT signed, httpOnly cookies                      |
| CSRF        | NextAuth built-in CSRF token                      |
| XSS         | React auto-escape + DOMPurify on HTML content     |
| SQL Injection | Prisma parameterized queries                   |
| Rate limit  | Redis ZSET sliding window                         |
| File upload | Type/size validation + virus scan (planned)       |
| Audit       | `AuditLog` table for sensitive actions            |

---

## 11. Testing Strategy

- **Unit tests** — Schema validation, pure functions, helpers (Jest)
- **Integration tests** — API routes (testcontainers PostgreSQL)
- **E2E tests** — Critical user flows (Playwright, planned)

CI pipeline (`.github/workflows/ci.yml`) runs on every PR.

---

## 12. Deployment

### Development
```bash
docker-compose up
```

### Production
- **Web**: Vercel (auto-scaling edge)
- **Database**: Railway / Supabase managed PostgreSQL
- **Redis**: Upstash serverless
- **Workers**: Railway / Render background service
- **Storage**: Cloudinary / AWS S3
- **Monitoring**: Sentry (errors) + Plausible (analytics)

---

## 13. Scaling Roadmap

| Stage           | Users  | Changes                                          |
|-----------------|--------|--------------------------------------------------|
| MVP             | <1K    | Current architecture                             |
| Growth          | 10K    | + Read replica, CDN for videos                   |
| Scale           | 100K   | + Split into microservices (payments, analytics) |
| Enterprise      | 1M+    | + Dedicated per-tenant DB shards                 |

---

## 14. Technology choices rationale

| Choice       | Why                                            | Alternative          |
|--------------|------------------------------------------------|----------------------|
| Next.js 15   | Fullstack React, built-in SSR, App Router     | Remix, Nuxt          |
| Prisma       | Type-safe ORM, migrations                     | Drizzle, Kysely      |
| PostgreSQL   | JSONB, FTS, reliable, proven at scale         | MySQL, MongoDB       |
| NextAuth v5  | Framework-native, multi-provider              | Clerk, Supabase Auth |
| Tailwind CSS | Rapid styling, tree-shake unused              | CSS Modules, vanilla |
| BullMQ       | Redis-based, robust retry, TypeScript         | Inngest, Temporal    |
| Stripe       | Industry standard, global coverage             | Paddle, Lemon Squeezy |
| Recharts     | React-native, customizable                     | Chart.js, Visx       |
