import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  OnboardingState,
  OnboardingStep,
  SkillLevel,
  LearningGoal,
  LearningStyle,
} from "./onboardingTypes";

interface OnboardingActions {
  setGoals: (goals: LearningGoal[]) => void;
  setLevel: (level: SkillLevel) => void;
  setLearningStyles: (styles: LearningStyle[]) => void;
  setSchedule: (days: number, minutes: number) => void;
  completeStep: (stepId: string) => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  completeDashboardTour: () => void;
  getNextIncompleteStep: () => OnboardingStep;
  resetOnboarding: () => void;
  setCurrentStep: (step: OnboardingStep) => void;
}

export type OnboardingStore = OnboardingState & OnboardingActions;

const initialState: OnboardingState = {
  onboardingCompleted: false,
  dashboardTourCompleted: false,
  skipped: false,
  currentStep: "welcome",
  goals: [],
  level: null,
  learningStyles: [],
  weeklyDays: null,
  dailyMinutes: null,
  // accountCreated + loggedIn are always considered done at this point
  completedSteps: ["accountCreated", "loggedIn"],
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setGoals: (goals) =>
        set({
          goals,
          completedSteps: goals.length > 0
            ? [...new Set([...get().completedSteps, "goalSelected"])]
            : get().completedSteps.filter((s) => s !== "goalSelected"),
        }),

      setLevel: (level) => set({ level }),

      setLearningStyles: (styles) => set({ learningStyles: styles }),

      setSchedule: (weeklyDays, dailyMinutes) => set({ weeklyDays, dailyMinutes }),

      completeStep: (stepId) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(stepId)
            ? state.completedSteps
            : [...state.completedSteps, stepId],
        })),

      skipOnboarding: () => set({ skipped: true }),

      completeOnboarding: () =>
        set((state) => ({
          onboardingCompleted: true,
          completedSteps: [
            ...new Set([
              ...state.completedSteps,
              "accountCreated",
              "loggedIn",
              "goalSelected",
              "levelSelected",
              "learningStyleSelected",
              "scheduleSelected",
            ]),
          ],
        })),

      completeDashboardTour: () => set({ dashboardTourCompleted: true }),

      getNextIncompleteStep: (): OnboardingStep => {
        const state = get();
        if (!state.goals.length) return "goal";
        if (!state.level) return "level";
        if (!state.learningStyles.length) return "learning-style";
        if (!state.weeklyDays || !state.dailyMinutes) return "schedule";
        return "complete";
      },

      resetOnboarding: () => set(initialState),

      setCurrentStep: (step) => set({ currentStep: step }),
    }),
    {
      name: "edunity-onboarding",
      // TODO: Replace with API persistence when backend is ready
      // On save: POST /api/v1/users/me/onboarding { ...state }
      // On load: GET /api/v1/users/me/onboarding → merge with local
    }
  )
);
