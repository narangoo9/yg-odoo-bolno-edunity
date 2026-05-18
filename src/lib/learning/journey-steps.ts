export type JourneyStepId =
  | "choose_course"
  | "watch_lessons"
  | "complete_tasks"
  | "submit_project"
  | "peer_review"
  | "earn_certificate";

export type JourneyStep = {
  id: JourneyStepId;
  title: string;
  description: string;
};

export const LEARNING_JOURNEY_STEPS: JourneyStep[] = [
  {
    id: "choose_course",
    title: "Хичээл сонгох",
    description: "Каталогоос өөрт тохирох курсыг сонгоно.",
  },
  {
    id: "watch_lessons",
    title: "Хичээл үзэх",
    description: "Видео хичээлүүдийг үзэж, мэдлэгээ бэлтгэнэ.",
  },
  {
    id: "complete_tasks",
    title: "Даалгавар гүйцэтгэх",
    description: "Quiz болон практик даалгавруудыг биелүүлнэ.",
  },
  {
    id: "submit_project",
    title: "Төсөл илгээх",
    description: "Эцсийн төслөө илгээн бодит ур чадвараа харуулна.",
  },
  {
    id: "peer_review",
    title: "Peer review авах",
    description: "Бусад суралцагчдын үнэлгээг хүлээн авна.",
  },
  {
    id: "earn_certificate",
    title: "Сертификат авах",
    description: "Бүх шаардлага биелсний дараа гэрчилгээ олгоно.",
  },
];

export type JourneyStats = {
  enrolledCourses: number;
  completedLessons: number;
  completedCourses: number;
  certificates: number;
  quizAttempts: number;
};

export type JourneyStepState = JourneyStep & {
  status: "completed" | "current" | "locked";
};

export function buildLearningJourney(stats: JourneyStats): {
  steps: JourneyStepState[];
  progressPercent: number;
  currentStepId: JourneyStepId;
} {
  const completed = new Set<JourneyStepId>();

  if (stats.enrolledCourses > 0) completed.add("choose_course");
  if (stats.completedLessons > 0) completed.add("watch_lessons");
  if (stats.quizAttempts > 0 || stats.completedLessons >= 3) completed.add("complete_tasks");
  if (stats.completedCourses > 0 || stats.completedLessons >= 8) completed.add("submit_project");
  if (stats.completedCourses > 0) completed.add("peer_review");
  if (stats.certificates > 0) completed.add("earn_certificate");

  const ordered = LEARNING_JOURNEY_STEPS.map((s) => s.id);
  let currentStepId: JourneyStepId = "choose_course";
  for (const id of ordered) {
    if (!completed.has(id)) {
      currentStepId = id;
      break;
    }
    currentStepId = id;
  }
  if (completed.has("earn_certificate")) {
    currentStepId = "earn_certificate";
  }

  const steps: JourneyStepState[] = LEARNING_JOURNEY_STEPS.map((step) => {
    if (completed.has(step.id)) {
      return { ...step, status: "completed" };
    }
    if (step.id === currentStepId) {
      return { ...step, status: "current" };
    }
    return { ...step, status: "locked" };
  });

  const progressPercent = Math.round((completed.size / LEARNING_JOURNEY_STEPS.length) * 100);

  return { steps, progressPercent, currentStepId };
}
