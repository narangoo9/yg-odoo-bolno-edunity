import type { OnboardingState, GettingStartedItem } from "./onboardingTypes";
import { GETTING_STARTED_ITEMS } from "./onboardingTypes";

export function buildChecklistItems(
  state: Pick<OnboardingState, "completedSteps">
): GettingStartedItem[] {
  return GETTING_STARTED_ITEMS.map((item) => ({
    ...item,
    completed: state.completedSteps.includes(item.id),
  }));
}

export function getOnboardingProgress(state: OnboardingState): {
  completedCount: number;
  totalCount: number;
  percentage: number;
} {
  const items = buildChecklistItems(state);
  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  return {
    completedCount,
    totalCount,
    percentage: Math.round((completedCount / totalCount) * 100),
  };
}

export function getContinueOnboardingRoute(state: OnboardingState): string {
  if (!state.goals.length) return "/onboarding/goal";
  if (!state.level) return "/onboarding/level";
  if (!state.learningStyles.length) return "/onboarding/learning-style";
  if (!state.weeklyDays || !state.dailyMinutes) return "/onboarding/schedule";
  return "/onboarding/complete";
}
