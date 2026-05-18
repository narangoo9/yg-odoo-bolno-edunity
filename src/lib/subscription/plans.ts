/**
 * @deprecated Use `@/lib/billing/plans` directly.
 * Thin re-exports for existing imports.
 */
export {
  type PlanId,
  type PlanId as AppPlan,
  DEFAULT_PLAN_ID,
  normalizePlanId,
  normalizePlanId as normalizePlan,
  getPlanById,
  getPlanById as getPlanConfig,
  isPaidPlan,
  canAccessPremium,
  canAccessPro,
  canAccessLesson,
  canAccessLessonSection,
  canDownloadCertificate,
  canAccessPaidCourseCertificate as canAccessCertificate,
  getAiDailyLimit,
  getNoteLimit,
  getSavedCourseLimit,
  getUpgradePrompt,
  formatMnt,
  PLANS as PLAN_CONFIG,
} from "@/lib/billing/plans";
