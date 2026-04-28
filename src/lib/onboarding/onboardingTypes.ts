export type OnboardingStep =
  | "welcome"
  | "goal"
  | "level"
  | "learning-style"
  | "schedule"
  | "complete";

export type SkillLevel = "beginner" | "intermediate" | "advanced";

export type LearningGoal =
  | "programming"
  | "design"
  | "business"
  | "ai"
  | "language"
  | "personal-development";

export type LearningStyle = "video" | "pdf" | "task" | "chat" | "challenge";

export type OnboardingState = {
  onboardingCompleted: boolean;
  dashboardTourCompleted: boolean;
  skipped: boolean;
  currentStep: OnboardingStep;
  goals: LearningGoal[];
  level: SkillLevel | null;
  learningStyles: LearningStyle[];
  weeklyDays: number | null;
  dailyMinutes: number | null;
  completedSteps: string[];
};

export type GettingStartedItem = {
  id: string;
  label: string;
  completed: boolean;
  route?: string;
};

export const GETTING_STARTED_ITEMS: Omit<GettingStartedItem, "completed">[] = [
  { id: "accountCreated", label: "Account created" },
  { id: "loggedIn", label: "Logged in" },
  { id: "goalSelected", label: "Learning goal selected", route: "/onboarding/goal" },
  { id: "firstCourseStarted", label: "Start first course", route: "/student/catalog" },
  { id: "firstLessonCompleted", label: "Complete first lesson" },
  { id: "profileCustomized", label: "Customize profile", route: "/student/settings" },
  { id: "firstCertificateEarned", label: "Earn first certificate" },
];
