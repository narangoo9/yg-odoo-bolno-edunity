# API Documentation

Base URL: `https://your-domain.com/api/v1`

---

## Authentication

Бүх protected endpoint NextAuth session cookie шаарддаг.

```
Cookie: next-auth.session-token=<jwt>
```

---

## Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human message"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Human-readable error",
  "details": { "field": ["error array"] }
}
```

---

## Status Codes

| Code | Meaning                           |
|------|-----------------------------------|
| 200  | OK                                |
| 201  | Created                           |
| 400  | Bad Request (validation)          |
| 401  | Unauthorized (not logged in)      |
| 403  | Forbidden (insufficient role)     |
| 404  | Not Found                         |
| 429  | Too Many Requests (rate limit)    |
| 500  | Server Error                      |

---

## Endpoints

### 🔐 Authentication

#### `POST /api/v1/auth/register`
Шинэ хэрэглэгч бүртгэнэ.

**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123",
  "confirmPassword": "Password123",
  "role": "STUDENT"
}
```

**200 Response:**
```json
{
  "success": true,
  "message": "Бүртгэл амжилттай. Имэйлээ шалгана уу."
}
```

#### `POST /api/auth/signin/credentials`
NextAuth handler. Login.

#### `POST /api/auth/signout`
NextAuth handler. Logout.

---

### 📚 Courses

#### `GET /api/v1/courses`
Курсуудыг жагсаах, шүүх.

**Query params:**
- `search` — текст хайлт
- `categoryId` — категориор шүүх
- `level` — BEGINNER / INTERMEDIATE / ADVANCED / ALL_LEVELS
- `language` — mn / en / ru
- `isFree` — "true" гэвэл үнэгүй курсууд
- `page` — хуудас (default: 1)
- `limit` — 1 хуудас дахь тоо (max: 50)
- `sortBy` — newest / popular / rating / price-asc / price-desc

**Response:**
```json
{
  "success": true,
  "data": {
    "courses": [...],
    "pagination": {
      "page": 1, "limit": 12, "total": 150,
      "totalPages": 13, "hasNext": true, "hasPrev": false
    }
  }
}
```

#### `POST /api/v1/courses`
**🔒 Auth required. Role: INSTRUCTOR+**

```json
{
  "title": "...",
  "description": "...",
  "level": "INTERMEDIATE",
  "price": 49000,
  "learningOutcomes": ["...", "..."]
}
```

#### `GET /api/v1/courses/:id`
Курс нэг бүрчлэн.

#### `PATCH /api/v1/courses/:id`
**🔒 Auth required. Course owner or admin.**

#### `DELETE /api/v1/courses/:id`
Курсийг archive болгоно (soft delete).

#### `POST /api/v1/courses/:id/enroll`
**🔒 Auth required.**

Үнэгүй курсад шууд бүртгэнэ. Төлбөртэй курсад checkout URL буцаана.

```json
// Free course response:
{ "success": true, "data": { ... } }

// Paid course response:
{
  "success": true,
  "data": {
    "requiresPayment": true,
    "courseId": "...",
    "price": 49000,
    "currency": "MNT"
  }
}
```

---

### 📖 Lessons

#### `POST /api/v1/lessons/:id/complete`
**🔒 Auth required. Student must be enrolled.**

Хичээлийг дүүргэсэн болгож тэмдэглэнэ.

```json
{
  "success": true,
  "data": {
    "courseCompleted": false  // true if last lesson
  }
}
```

---

### 🏆 Certificates

#### `GET /api/v1/certificates/verify/:code`
**Public endpoint.**

Сертификат баталгаажуулна.

```json
{
  "success": true,
  "data": {
    "certificateNo": "CERT-1234567890-AB12CD",
    "issuedAt": "2026-03-15T10:00:00Z",
    "student": { "name": "..." },
    "course": { "title": "...", "instructor": { "name": "..." } }
  }
}
```

---

### 💳 Payments

#### `POST /api/v1/payments/checkout`
**🔒 Auth required.**

Stripe Checkout session үүсгэнэ.

```json
// Request
{ "courseId": "clxxxx..." }

// Response
{
  "success": true,
  "data": {
    "url": "https://checkout.stripe.com/...",
    "sessionId": "cs_..."
  }
}
```

#### `POST /api/webhooks/stripe`
Stripe webhook handler.

Supported events:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

---

### 📁 Upload

#### `POST /api/v1/upload`
**🔒 Auth required. Rate-limited 20/hour.**

Multipart form upload:
- `file` — File
- `category` — IMAGE / VIDEO / DOCUMENT / AVATAR
- `folder` — өөрийн folder нэр

**Limits:**
- IMAGE: 5MB (jpeg, png, webp)
- VIDEO: 500MB (mp4, mov)
- DOCUMENT: 20MB (pdf)
- AVATAR: 2MB

---

### 📊 Analytics

#### `GET /api/v1/analytics`
**🔒 Auth required. Role: SUPER_ADMIN.**

Админ тойм мэдээлэл.

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 1234,
      "activeStudents": 890,
      "totalCourses": 56,
      "publishedCourses": 45,
      "totalEnrollments": 3200,
      "totalCertificates": 450,
      "totalRevenue": 12500000,
      "newUsersThisMonth": 87
    },
    "revenue": [...],
    "enrollments": [...],
    "topCourses": [...],
    "userGrowth": [...]
  }
}
```

---

### 👤 Users

#### `GET /api/v1/users/me`
Өөрийн профайл.

#### `PATCH /api/v1/users/me`
Профайл шинэчлэх.

```json
{
  "name": "New Name",
  "bio": "Bio text",
  "avatarUrl": "https://..."
}
```

---

## Rate Limiting

| Endpoint category | Limit              |
|-------------------|--------------------|
| Auth              | 5 attempts / 15min |
| Upload            | 20 / hour per user |
| API (general)     | 100 / minute       |
| Webhooks          | None               |

---

## Pagination

List endpoints return pagination object:

```json
{
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 150,
    "totalPages": 13,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Errors Reference

| Error                    | Code |
|--------------------------|------|
| `Нэвтрэх шаардлагатай`  | 401  |
| `Эрхгүй`                | 403  |
| `Курс олдсонгүй`        | 404  |
| `Validation failed`      | 400  |
| `Серверийн алдаа`       | 500  |
