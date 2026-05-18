# Tenant Isolation Audit

**Base commit:** `7bae316`  
**Scope:** Prisma queries, server actions, socket chat

## Fixes applied

| Area | Issue | Fix |
|------|--------|-----|
| **Enrollment** | Paid courses enrollable without payment | `enrollCourse` checks price + completed `Payment` or active subscription |
| **Course delete** | ORG_ADMIN could not delete org courses | `deleteCourse` mirrors `updateCourse` org-admin rule |
| **Certificate verify** | Public email leak | Verify API returns name only (see API audit) |

## Access model

| Resource | Isolation rule |
|----------|----------------|
| Courses (draft) | Instructor, org admin (same `organizationId`), super admin |
| Courses (published catalog) | Global marketplace (by design) |
| Lessons | Enrollment or manage role (`lessons/[id]`, socket `assertLessonAccess`) |
| Certificates (download) | Owner, org admin (cert org), super admin |
| Peer review | Same-course enrollment (course-scoped, not org-scoped) |
| Org admin pages | `organizationId` from session + membership checks |
| Chat (Supabase) | RLS + `conversation_members` |

## Remaining risks

| Risk | Mitigation |
|------|------------|
| JWT `organizationId` stale after invite | Refresh profile on `session.update()` or short TTL |
| `getCourseById` no org filter | Callers must enforce; split public vs admin queries if exposing by UUID |
| Certificate service has no internal ACL | Callers must use download route pattern; add `assertCertificateAccess()` if reused |

## Good patterns

- Socket `assertLessonAccess`: enrollment or instructor/org-admin/super-admin
- Org courses/analytics: `where: { organizationId }`
- Learning APIs: `studentId` + `courseId` enrollment checks
