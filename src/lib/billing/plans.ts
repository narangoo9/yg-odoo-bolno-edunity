/**
 * Single source of truth for EduNity billing plans (Standard / Premium / Pro).
 * Import helpers from here — never hardcode prices or plan IDs elsewhere.
 */

export const PLAN_IDS = ["STANDARD", "PREMIUM", "PRO"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const DEFAULT_PLAN_ID: PlanId = "STANDARD";
export const PAID_PLAN_IDS: PlanId[] = ["PREMIUM", "PRO"];

export type PlanBadge = "Most Popular" | "Best Value";

export interface BillingPlan {
  id: PlanId;
  name: string;
  priceMnt: number;
  displayPrice: string;
  interval: "month";
  role: string;
  badge: PlanBadge | null;
  cta: string;
  description: string;
  features: string[];
}

export const PLANS: Record<PlanId, BillingPlan> = {
  STANDARD: {
    id: "STANDARD",
    name: "Standard",
    priceMnt: 0,
    displayPrice: "Үнэгүй",
    interval: "month",
    role: "New users",
    badge: null,
    cta: "Үнэгүй эхлэх",
    description: "Үнэгүй хичээлээр эхлэх",
    features: [
      "Үнэгүй курсууд",
      "Intro lessons",
      "Үндсэн ахиц хянах",
      "Community chat",
      "XP & leaderboard",
      "2 GB note storage",
      "Free course certificates",
    ],
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium",
    priceMnt: 9900,
    displayPrice: "₮9,900",
    interval: "month",
    role: "Main conversion",
    badge: "Most Popular",
    cta: "Premium авах",
    description: "Бүх үндсэн сургалт, AI туслах, сертификат",
    features: [
      "Standard бүгд",
      "Premium course access",
      "Company learning tracks",
      "AI assistant limited usage",
      "Peer review",
      "Final project submit",
      "Downloadable certificates",
      "Advanced analytics",
      "20 GB note storage",
      "Priority support",
    ],
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    priceMnt: 19900,
    displayPrice: "₮19,900",
    interval: "month",
    role: "Advanced users",
    badge: "Best Value",
    cta: "Pro авах",
    description: "Дэвшилтэт AI, career tools, бүрэн боломжууд",
    features: [
      "Premium бүгд",
      "Unlimited course access",
      "Advanced AI mentor",
      "CV/portfolio review tools",
      "Private study groups",
      "Exclusive certificates",
      "Early-access courses",
      "Productivity tools",
      "100 GB storage",
      "Faster support",
    ],
  },
};

export const PLAN_LIST: BillingPlan[] = [PLANS.STANDARD, PLANS.PREMIUM, PLANS.PRO];

export interface BillingComparisonRow {
  feature: string;
  standard: boolean | string;
  premium: boolean | string;
  pro: boolean | string;
}

export const BILLING_COMPARISON: BillingComparisonRow[] = [
  { feature: "Үнэгүй курсууд", standard: true, premium: true, pro: true },
  { feature: "Intro lessons", standard: true, premium: true, pro: true },
  { feature: "Premium course access", standard: false, premium: true, pro: true },
  { feature: "Peer review", standard: false, premium: true, pro: true },
  { feature: "Downloadable certificates", standard: false, premium: true, pro: true },
  { feature: "AI туслах", standard: false, premium: "Хязгаарлагдсан", pro: "Дэвшилтэт" },
  { feature: "Career / CV tools", standard: false, premium: false, pro: true },
  { feature: "Note storage", standard: "2 GB", premium: "20 GB", pro: "100 GB" },
  { feature: "Дэмжлэг", standard: "Community", premium: "Priority", pro: "Faster" },
];

/** Map legacy DB / API plan strings to a valid PlanId. */
export function normalizePlanId(raw?: string | null): PlanId {
  if (!raw) return DEFAULT_PLAN_ID;
  if (raw === "PRO") return "PRO";
  if (raw === "PREMIUM") return "PREMIUM";
  if (raw === "STANDARD" || raw === "BASIC" || raw === "FREE" || raw === "STUDENT") {
    return "STANDARD";
  }
  if (
    raw === "ENTERPRISE" ||
    raw === "INSTRUCTOR" ||
    raw === "ORGANIZATION" ||
    raw === "ALL_ACCESS"
  ) {
    return "PRO";
  }
  return DEFAULT_PLAN_ID;
}

export function getPlanById(id: string): BillingPlan {
  const planId = normalizePlanId(id);
  return PLANS[planId];
}

export function isPaidPlan(plan: PlanId | string): boolean {
  const id = typeof plan === "string" ? normalizePlanId(plan) : plan;
  return PAID_PLAN_IDS.includes(id);
}

export function canAccessPremium(plan: PlanId | string): boolean {
  const id = typeof plan === "string" ? normalizePlanId(plan) : plan;
  return id === "PREMIUM" || id === "PRO";
}

export function canAccessPro(plan: PlanId | string): boolean {
  const id = typeof plan === "string" ? normalizePlanId(plan) : plan;
  return id === "PRO";
}

export function formatMnt(amount: number): string {
  if (amount === 0) return "Үнэгүй";
  return `₮${amount.toLocaleString("mn-MN")}`;
}

export function formatPlanPrice(plan: PlanId | string, suffix = "/ сар"): string {
  const p = getPlanById(typeof plan === "string" ? plan : plan);
  if (p.priceMnt === 0) return p.displayPrice;
  return `${p.displayPrice}${suffix}`;
}

// ─── Feature gates ───────────────────────────────────────────────────────────

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["ACTIVE", "TRIALING"]);

export function hasActiveSubscription(status?: string | null): boolean {
  if (!status) return true;
  return ACTIVE_SUBSCRIPTION_STATUSES.has(status);
}

export function getEffectivePlan(
  plan?: string | null,
  status?: string | null,
): PlanId {
  const normalized = normalizePlanId(plan);
  if (!isPaidPlan(normalized)) return normalized;
  if (!hasActiveSubscription(status)) return DEFAULT_PLAN_ID;
  return normalized;
}

export function canAccessPremiumCourses(plan: PlanId | string): boolean {
  return canAccessPremium(plan);
}

export function canAccessPeerReview(plan: PlanId | string): boolean {
  return canAccessPremium(plan);
}

export function canDownloadCertificate(plan: PlanId | string): boolean {
  return canAccessPremium(plan);
}

export function canAccessFreeCourseCertificate(): boolean {
  return true;
}

export function canAccessPaidCourseCertificate(plan: PlanId | string): boolean {
  return canAccessPremium(plan);
}

export function canAccessAdvancedAi(plan: PlanId | string): boolean {
  return canAccessPro(plan);
}

export function canAccessCareerTools(plan: PlanId | string): boolean {
  return canAccessPro(plan);
}

export function canAccessAdvancedAnalytics(plan: PlanId | string): boolean {
  return canAccessPremium(plan);
}

export function getNoteStorageGb(plan: PlanId | string): number {
  const id = typeof plan === "string" ? normalizePlanId(plan) : plan;
  if (id === "PRO") return 100;
  if (id === "PREMIUM") return 20;
  return 2;
}

export function getNoteLimit(plan: PlanId | string): number | null {
  const gb = getNoteStorageGb(plan);
  if (gb >= 100) return null;
  if (gb >= 20) return 500;
  return 50;
}

export function getAiDailyLimit(plan: PlanId | string): number {
  const id = typeof plan === "string" ? normalizePlanId(plan) : plan;
  if (id === "PRO") return 100;
  if (id === "PREMIUM") return 20;
  return 3;
}

export function getSavedCourseLimit(plan: PlanId | string): number | null {
  if (canAccessPro(plan)) return null;
  if (canAccessPremium(plan)) return null;
  return 3;
}

/**
 * Lesson / section access within a course (0-based index).
 * - PRO: all items
 * - PREMIUM: ~75% of items
 * - STANDARD: intro only (first item + free-marked)
 */
export function canAccessLearningItem(
  plan: PlanId | string,
  index: number,
  totalItems: number,
  isFreeItem = false,
): boolean {
  if (totalItems <= 0) return false;
  if (isFreeItem) return true;
  const id = typeof plan === "string" ? normalizePlanId(plan) : plan;
  if (id === "PRO") return true;
  if (id === "PREMIUM") return index < Math.ceil(totalItems * 0.75);
  return index === 0;
}

export function canAccessLesson(
  plan: PlanId | string,
  lessonIndex: number,
  totalLessons: number,
  isFreeLesson = false,
): boolean {
  return canAccessLearningItem(plan, lessonIndex, totalLessons, isFreeLesson);
}

export function canAccessLessonSection(
  plan: PlanId | string,
  sectionIndex: number,
  totalSections: number,
  isFreeSection = false,
): boolean {
  return canAccessLearningItem(plan, sectionIndex, totalSections, isFreeSection);
}

export function getUpgradePrompt(currentPlan: PlanId | string): {
  message: string;
  cta: string;
  targetPlan: PlanId;
} {
  const id = typeof currentPlan === "string" ? normalizePlanId(currentPlan) : currentPlan;
  if (id === "STANDARD") {
    return {
      message: "Энэ хичээл таны багцад нээгдээгүй байна.",
      cta: PLANS.PREMIUM.cta,
      targetPlan: "PREMIUM",
    };
  }
  return {
    message: "Энэ хичээл Pro багцад нээгдэнэ.",
    cta: PLANS.PRO.cta,
    targetPlan: "PRO",
  };
}

export const SUBSCRIPTION_STATUS_LABELS: Record<
  string,
  { label: string; color: string; userMessage?: string }
> = {
  ACTIVE: { label: "Идэвхтэй", color: "text-emerald-600" },
  TRIALING: { label: "Туршилт", color: "text-violet-600" },
  PAST_DUE: {
    label: "Төлбөр хоцорсон",
    color: "text-red-500",
    userMessage: "Төлбөр амжилтгүй боллоо. Картаа шалгаад дахин оролдоно уу.",
  },
  CANCELLED: {
    label: "Цуцлагдсан",
    color: "text-amber-600",
    userMessage:
      "Таны багц цуцлагдсан. Одоогийн хугацаа дуусах хүртэл ашиглах боломжтой.",
  },
  EXPIRED: { label: "Хугацаа дууссан", color: "text-amber-600" },
};

export function isFreePlan(plan?: string | null): boolean {
  return !isPaidPlan(normalizePlanId(plan));
}
