// Central source of truth for subscription plans.
// App logic must go through these helpers — never compare raw DB plan strings directly.

export type AppPlan = "FREE" | "STANDARD" | "PRO";

export interface PlanConfig {
  id: AppPlan;
  label: string;
  priceMnt: number;
  priceText: string;
  description: string;
}

export const PLAN_CONFIG: Record<AppPlan, PlanConfig> = {
  FREE: {
    id: "FREE",
    label: "Free",
    priceMnt: 0,
    priceText: "0₮",
    description: "Эхэлж туршихад тохиромжтой",
  },
  STANDARD: {
    id: "STANDARD",
    label: "Standard",
    priceMnt: 9900,
    priceText: "9,900₮ / сар",
    description: "Суралцах эхний түвшнээ цэгцтэй дуусгахад тохиромжтой",
  },
  PRO: {
    id: "PRO",
    label: "Pro",
    priceMnt: 19900,
    priceText: "19,900₮ / сар",
    description: "Бүх lesson, certificate, AI mentor болон premium tools нээгдэнэ",
  },
};

/**
 * Normalize any raw DB/API plan string to a valid AppPlan.
 * Legacy PREMIUM → STANDARD, ALL_ACCESS/ENTERPRISE → PRO, unknown → FREE.
 */
export function normalizePlan(plan?: string | null): AppPlan {
  if (!plan) return "FREE";
  if (plan === "PRO") return "PRO";
  if (plan === "STANDARD" || plan === "BASIC" || plan === "STUDENT") return "STANDARD";
  // Legacy mappings — kept for DB records that still store old names
  if (plan === "PREMIUM") return "STANDARD";
  if (plan === "ALL_ACCESS" || plan === "ENTERPRISE") return "PRO";
  return "FREE";
}

export function getPlanConfig(plan: AppPlan): PlanConfig {
  return PLAN_CONFIG[plan];
}

/** Daily AI mentor request limits per plan. */
export function getAiDailyLimit(plan: AppPlan): number {
  if (plan === "PRO") return 100;
  if (plan === "STANDARD") return 20;
  return 3;
}

/** Max saved courses. null = unlimited. */
export function getSavedCourseLimit(plan: AppPlan): number | null {
  if (plan === "PRO" || plan === "STANDARD") return null;
  return 3;
}

/** Max total notes. null = unlimited. */
export function getNoteLimit(plan: AppPlan): number | null {
  if (plan === "PRO" || plan === "STANDARD") return null;
  return 5;
}

/** Only PRO users can receive/generate certificates. */
export function canAccessCertificate(plan: AppPlan): boolean {
  return plan === "PRO";
}

/**
 * Whether a user with `plan` can access the lesson at `lessonIndex`
 * (0-based) in a course that has `totalLessons` lessons total.
 *
 * - PRO: all lessons
 * - STANDARD: first ceil(50%) of lessons
 * - FREE: only index 0 (or any lesson marked isFree)
 */
export function canAccessLesson(
  plan: AppPlan,
  lessonIndex: number,
  totalLessons: number,
  isFreeLesson = false,
): boolean {
  if (totalLessons <= 0) return false;
  if (isFreeLesson) return true;
  if (plan === "PRO") return true;
  if (plan === "STANDARD") return lessonIndex < Math.ceil(totalLessons * 0.5);
  // FREE: first lesson only
  return lessonIndex === 0;
}

/**
 * Whether a user with `plan` can access the lesson section at `sectionIndex`
 * (0-based) in a lesson that has `totalSections` sections.
 *
 * Uses the same proportional rule as canAccessLesson.
 */
export function canAccessLessonSection(
  plan: AppPlan,
  sectionIndex: number,
  totalSections: number,
): boolean {
  if (totalSections <= 0) return false;
  if (plan === "PRO") return true;
  if (plan === "STANDARD") return sectionIndex < Math.ceil(totalSections * 0.5);
  return sectionIndex === 0;
}

/** Upgrade prompt text shown when a lesson is locked for a given plan. */
export function getUpgradePrompt(currentPlan: AppPlan): { message: string; cta: string; targetPlan: AppPlan } {
  if (currentPlan === "FREE") {
    return {
      message: "Энэ lesson таны багцад нээгдээгүй байна.",
      cta: "Standard авах",
      targetPlan: "STANDARD",
    };
  }
  return {
    message: "Энэ lesson таны багцад нээгдээгүй байна.",
    cta: "Pro авах",
    targetPlan: "PRO",
  };
}
