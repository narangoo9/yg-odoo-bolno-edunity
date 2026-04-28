import type { OnboardingStep } from "./onboardingTypes";

export const STEP_ORDER: OnboardingStep[] = [
  "welcome",
  "goal",
  "level",
  "learning-style",
  "schedule",
  "complete",
];

export const STEP_META: Record<OnboardingStep, { label: string; index: number }> = {
  welcome: { label: "Тавтай морил", index: 0 },
  goal: { label: "Зорилго", index: 1 },
  level: { label: "Түвшин", index: 2 },
  "learning-style": { label: "Сурах хэв", index: 3 },
  schedule: { label: "Хуваарь", index: 4 },
  complete: { label: "Дуусгах", index: 5 },
};

export const STEP_ROUTES: Record<OnboardingStep, string> = {
  welcome: "/onboarding/welcome",
  goal: "/onboarding/goal",
  level: "/onboarding/level",
  "learning-style": "/onboarding/learning-style",
  schedule: "/onboarding/schedule",
  complete: "/onboarding/complete",
};

export function getStepFromPath(path: string): OnboardingStep {
  const segment = path.split("/onboarding/")[1]?.split("/")[0] as OnboardingStep;
  return STEP_ORDER.includes(segment) ? segment : "welcome";
}

export function getPrevRoute(step: OnboardingStep): string | null {
  const idx = STEP_ORDER.indexOf(step);
  if (idx <= 0) return null;
  return STEP_ROUTES[STEP_ORDER[idx - 1]];
}

export function getNextRoute(step: OnboardingStep): string | null {
  const idx = STEP_ORDER.indexOf(step);
  if (idx >= STEP_ORDER.length - 1) return null;
  return STEP_ROUTES[STEP_ORDER[idx + 1]];
}
