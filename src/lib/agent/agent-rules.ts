import type { AgentContext, AgentIntent, AgentResponse } from "./agent-types";
import { detectAgentIntent } from "./agent-intent";
import { ACTION, navigateAction } from "./agent-actions";

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(n: number) {
  return n === 100 ? "100% ✅" : `${n}%`;
}

function firstName(context: AgentContext) {
  return context.userName?.split(" ")[0] ?? "Чи";
}

// ── Intent handlers ───────────────────────────────────────────────────────────

function handleContinueLearning(ctx: AgentContext): AgentResponse {
  const name = firstName(ctx);
  const course = ctx.activeCourse;

  if (!course) {
    return {
      message: `${name}, одоогоор бүртгэлтэй хичээл байхгүй байна. Catalog-аас өөрт тохирох хичээлийг сонго!\n\n🎯 Хичээлд нэгдсэнээр progress хянаж, certificate авах замд орно.`,
      intent: "CONTINUE_LEARNING",
      actions: [ACTION.catalog()],
      suggestions: ["Надад course санал болго", "Миний progress хэд вэ?"],
      mode: "rule-based",
    };
  }

  const remaining = course.totalLessons - course.completedLessons;
  const nextPct =
    course.totalLessons > 0
      ? Math.round(((course.completedLessons + 1) / course.totalLessons) * 100)
      : course.progress;

  const continueLine =
    remaining > 0
      ? `Дараагийн хичээлийг үзвэл progress чинь ~${nextPct}% болно. Үлдсэн ${remaining} хичээлийн дараа ${course.hasCertificate ? "certificate авсан байна ✅" : "certificate авах боломжтой болно 🎓"}.`
      : "Бүх хичээлийг дуусгасан байна! Certificate-аа шалгаарай 🎓";

  return {
    message: `${name}, чи **${course.title}** хичээлийн ${course.completedLessons}/${course.totalLessons} хичээлийг дуусгасан (${pct(course.progress)}).\n\n${continueLine}`,
    intent: "CONTINUE_LEARNING",
    actions: [
      ACTION.continueLearning(course.id, course.lastLessonId),
      ACTION.studyPlan(),
      ACTION.courseDetail(course.id),
    ],
    suggestions: [
      "Certificate авахад юу дутуу вэ?",
      "Миний progress харуул",
      "7 хоногийн план гарга",
    ],
    mode: "rule-based",
  };
}

function handleExplainProgress(ctx: AgentContext): AgentResponse {
  const name = firstName(ctx);
  const { enrolledCourses, overallProgress, totalCompletedLessons, totalLessons, certificates } =
    ctx;

  if (enrolledCourses.length === 0) {
    return {
      message: `${name}, одоогоор бүртгэлтэй хичээл байхгүй. Catalog-аас хичээл сонгоод эхэлцгээе!`,
      intent: "EXPLAIN_PROGRESS",
      actions: [ACTION.catalog()],
      suggestions: ["Надад course санал болго"],
      mode: "rule-based",
    };
  }

  const courseLines = enrolledCourses
    .slice(0, 4)
    .map(
      (c) =>
        `• **${c.title}**: ${c.completedLessons}/${c.totalLessons} хичээл (${pct(c.progress)})${c.hasCertificate ? " 🎓" : ""}`,
    )
    .join("\n");

  const message = [
    `📊 **${name}-ийн сурлагын явц:**\n`,
    courseLines,
    `\n🎯 Нийт: ${totalCompletedLessons}/${totalLessons} хичээл дуусгасан (${pct(overallProgress)})`,
    certificates.length > 0 ? `🎓 Certificate: ${certificates.length} ширхэг авсан` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const actions = ctx.activeCourse
    ? [ACTION.continueLearning(ctx.activeCourse.id, ctx.activeCourse.lastLessonId)]
    : [ACTION.catalog()];

  return {
    message,
    intent: "EXPLAIN_PROGRESS",
    actions: [...actions, ACTION.certificateCheck()],
    suggestions: [
      "Certificate авахад юу дутуу вэ?",
      "7 хоногийн study plan гарга",
      "Би юу үзэх вэ?",
    ],
    mode: "rule-based",
  };
}

function handleCertificateStatus(ctx: AgentContext): AgentResponse {
  const name = firstName(ctx);
  const { certificates, enrolledCourses, activeCourse } = ctx;

  // Already has certificates → show them + highlight next opportunity
  if (certificates.length > 0) {
    const certLines = certificates
      .slice(0, 3)
      .map(
        (c) =>
          `🎓 ${c.courseTitle ?? "Course"} — ${new Date(c.issuedAt).toLocaleDateString("mn-MN")}`,
      )
      .join("\n");

    const incomplete = enrolledCourses
      .filter((c) => !c.hasCertificate && c.progress < 100)
      .sort((a, b) => b.progress - a.progress);

    let tail = "";
    const nextActions = [];

    if (incomplete.length > 0) {
      const next = incomplete[0];
      tail = `\n\n📌 **${next.title}** (${pct(next.progress)}) хичээлийг дуусгавал дараагийн certificate авна!`;
      nextActions.push(ACTION.continueLearning(next.id, next.lastLessonId));
    }

    return {
      message: `Баяр хүргэе ${name}! Чи ${certificates.length} certificate авсан байна:\n\n${certLines}${tail}`,
      intent: "CERTIFICATE_STATUS",
      actions: [...nextActions, ACTION.myProgress()],
      suggestions: ["Миний progress харуул", "Study plan гарга"],
      mode: "rule-based",
    };
  }

  // No enrollments yet
  if (!activeCourse) {
    return {
      message: `${name}, certificate авахын тулд:\n\n1️⃣ Catalog-аас хичээл сонго\n2️⃣ Бүх хичээл дуусга\n3️⃣ Final task илгээ\n4️⃣ Certificate татаж ав 🎓`,
      intent: "CERTIFICATE_STATUS",
      actions: [ACTION.catalog()],
      suggestions: ["Надад course санал болго"],
      mode: "rule-based",
    };
  }

  // Has active course, no certificate yet
  const remaining = activeCourse.totalLessons - activeCourse.completedLessons;
  const daysEstimate =
    remaining > 0 ? `~${Math.ceil(remaining / 2.5)} өдрийн дотор дуусгах боломжтой.` : "";

  const body =
    remaining > 0
      ? `✅ Дутуу: ${remaining} хичээл\n📊 Одоогийн явц: ${pct(activeCourse.progress)}\n\n💡 Өдөрт 2-3 хичээл үзвэл ${daysEstimate}`
      : "✅ Бүх хичээл дуусгасан байна! Final task болон peer review-г шалгаарай.";

  return {
    message: `**${activeCourse.title}** — Certificate авахад:\n\n${body}`,
    intent: "CERTIFICATE_STATUS",
    actions: [
      remaining > 0
        ? ACTION.continueLearning(activeCourse.id, activeCourse.lastLessonId)
        : navigateAction("Course дэлгэрэнгүй", `/student/courses/${activeCourse.id}`),
      ACTION.studyPlan(),
    ],
    suggestions: ["7 хоногийн план гарга", "Миний progress харуул"],
    mode: "rule-based",
  };
}

function handleCreateStudyPlan(ctx: AgentContext): AgentResponse {
  const name = firstName(ctx);
  const course = ctx.activeCourse ?? ctx.enrolledCourses[0];

  if (!course) {
    return {
      message: [
        `${name}, study plan гаргахын тулд эхлээд хичээлд бүртгүүлэх хэрэгтэй.\n`,
        "📅 **7 хоногийн ерөнхий план:**\n",
        "📚 1-р өдөр: Хичээл сонгох + эхний бүлэг үзэх",
        "📚 2-р өдөр: Үргэлжлүүлэх + тэмдэглэл авах",
        "📚 3-р өдөр: Давтах + quiz бэлдэх",
        "📚 4-р өдөр: Дадлагын даалгавар хийх",
        "📚 5-р өдөр: Final task эхлүүлэх",
        "📚 6-р өдөр: Peer review илгээх",
        "📚 7-р өдөр: Certificate авах / дараагийн хичээл сонгох",
      ].join("\n"),
      intent: "CREATE_STUDY_PLAN",
      actions: [ACTION.catalog()],
      suggestions: ["Надад course санал болго"],
      mode: "rule-based",
    };
  }

  const remaining = course.totalLessons - course.completedLessons;
  const perDay = Math.max(1, Math.ceil(remaining / 7));
  const willFinish = remaining <= 7 * perDay;

  const lines = [
    `📅 **${course.title} — 7 хоногийн план** (${pct(course.progress)} дуусгасан)\n`,
    `📚 1-р өдөр: ${perDay} хичээл үзэх`,
    `📚 2-р өдөр: ${perDay} хичээл + тэмдэглэл авах`,
    `📚 3-р өдөр: ${perDay} хичээл + давтах`,
    `📚 4-р өдөр: ${perDay} хичээл + quiz бэлдэх`,
    `📚 5-р өдөр: Final task эхлүүлэх`,
    `📚 6-р өдөр: Task дуусгах, peer review илгээх`,
    `📚 7-р өдөр: ${willFinish ? "Certificate авах 🎓" : "Хичээл үргэлжлүүлэх"}`,
    `\n💡 Өдөрт ~${perDay} хичээл үзвэл 7 хоногт ${Math.min(remaining, 7 * perDay)} хичээл дуусгах боломжтой.`,
  ];

  return {
    message: lines.join("\n"),
    intent: "CREATE_STUDY_PLAN",
    actions: [
      ACTION.continueLearning(course.id, course.lastLessonId),
      ACTION.certificateCheck(),
    ],
    suggestions: ["Certificate авахад юу дутуу вэ?", "Миний progress харуул"],
    mode: "rule-based",
  };
}

function handleRecommendCourse(ctx: AgentContext): AgentResponse {
  const name = firstName(ctx);
  const { enrolledCourses } = ctx;

  const inProgress = enrolledCourses.filter((c) => c.progress > 0 && c.progress < 100);
  const notStarted = enrolledCourses.filter((c) => c.progress === 0);

  if (inProgress.length > 0) {
    const top = [...inProgress].sort((a, b) => b.progress - a.progress)[0];
    return {
      message: `${name}, чи **${top.title}** хичээлийг ${pct(top.progress)} дуусгасан байна.\n\n🎯 Эхлүүлсэн хичээлээ дуусгах нь шинийг эхлүүлэхээс үр дүнтэй. Үргэлжлүүлж certificate авмаар байна уу?`,
      intent: "RECOMMEND_COURSE",
      actions: [
        ACTION.continueLearning(top.id, top.lastLessonId),
        ACTION.catalog(),
        ACTION.studyPlan(),
      ],
      suggestions: ["Миний progress хэд вэ?", "Certificate авахад юу дутуу вэ?"],
      mode: "rule-based",
    };
  }

  if (notStarted.length > 0) {
    const first = notStarted[0];
    return {
      message: `${name}, бүртгэлтэй **${first.title}** хичээлийг эхлүүлэх цаг болжээ!\n\n🚀 Анхны хичээлийг үзэхэд 10-15 минут л хангалттай.`,
      intent: "RECOMMEND_COURSE",
      actions: [ACTION.continueLearning(first.id), ACTION.studyPlan()],
      suggestions: ["Миний progress хэд вэ?", "Study plan гарга"],
      mode: "rule-based",
    };
  }

  return {
    message: `${name}, EduNity catalog-д Python, JavaScript, React, Figma, Node.js болон бусад хичээлүүд байна!\n\n🎯 Санал:\n• 🐍 Beginner → Python Fundamentals\n• 🎨 Design → Figma for Beginners\n• 💻 Frontend → JavaScript Essentials\n• ⚛️ Advanced → React + TypeScript`,
    intent: "RECOMMEND_COURSE",
    actions: [ACTION.catalog(), ACTION.myProgress()],
    suggestions: ["Миний progress хэд вэ?", "Certificate авахад юу дутуу вэ?"],
    mode: "rule-based",
  };
}

function handleTaskHelp(ctx: AgentContext): AgentResponse {
  const course = ctx.activeCourse;
  return {
    message: [
      "Final task хийх алхам:\n",
      "✅ 1. Хичээлийн бүх материалыг давт",
      "✅ 2. Шаардлагыг анхааралтай унших",
      "✅ 3. Жижиг хэсгүүдэд хувааж алхам алхмаар хий",
      "✅ 4. Кодоо тест хий (хэрэв code task бол)",
      "✅ 5. Peer review-д илгээх\n",
      "💡 Хамгийн чухал зүйл: эхлэх. Reviewer-үүд санал хүсэлт өгнө.\n\nЧадна! 💪",
    ].join("\n"),
    intent: "TASK_HELP",
    actions: course
      ? [ACTION.continueLearning(course.id, course.lastLessonId), ACTION.studyPlan()]
      : [ACTION.catalog()],
    suggestions: ["Certificate авахад юу дутуу вэ?", "Миний progress харуул"],
    mode: "rule-based",
  };
}

function handleFindCourse(): AgentResponse {
  return {
    message:
      "EduNity catalog-д олон чиглэлийн хичээлүүд байна!\n\n🔍 Catalog-аас хайхдаа:\n• Хичээлийн нэр эсвэл чиглэлээр хайх\n• Түвшнээр шүүх (Beginner / Intermediate / Advanced)\n• Үнэлгээгээр эрэмбэлэх\n\nЯмар чиглэлийн хичээл хайж байна вэ?",
    intent: "FIND_COURSE",
    actions: [navigateAction("Catalog нээх", "/student/catalog")],
    suggestions: [
      "Python хичээл санал болго",
      "JavaScript хичээл санал болго",
      "Миний progress хэд вэ?",
    ],
    mode: "rule-based",
  };
}

function handleLessonHelp(ctx: AgentContext): AgentResponse {
  return {
    message: [
      "Хичээлтэй холбоотой асуултад:\n",
      "💡 Хичээлийн агуулгыг дахин нэг удаа анхааралтай үз",
      "💡 Хичээлийн тэмдэглэл хэсэгт бүртгэж ав",
      "💡 Практик дасгалыг өөрөө туршиж үз",
      "💡 Ойлгохгүй хэсгийг 2-3 удаа давт\n",
      "❓ Тодорхой асуулт байвал надаас асуугаарай!",
    ].join("\n"),
    intent: "LESSON_HELP",
    actions: ctx.activeCourse
      ? [ACTION.continueLearning(ctx.activeCourse.id, ctx.activeCourse.lastLessonId)]
      : [ACTION.catalog()],
    suggestions: ["Task хийхэд туслаач", "Study plan гарга", "Миний progress харуул"],
    mode: "rule-based",
  };
}

function handleGeneralHelp(ctx: AgentContext): AgentResponse {
  const name = firstName(ctx);
  const primaryAction = ctx.activeCourse
    ? ACTION.continueLearning(ctx.activeCourse.id, ctx.activeCourse.lastLessonId)
    : ACTION.catalog();

  return {
    message: [
      `Сайн уу, ${name}! 👋 Би EduNity AI Mentor.\n`,
      "Дараах зүйлсэд тусалж чадна:\n",
      "📚 Хичээл үргэлжлүүлэх",
      "📊 Progress шалгах",
      "🎓 Certificate авах алхам",
      "📅 Study plan гаргах",
      "💡 Course санал",
      "✅ Task хийхэд туслах\n",
      "Ямар зүйл асуумаар байна?",
    ].join("\n"),
    intent: "GENERAL_HELP",
    actions: [primaryAction, ACTION.myProgress()],
    suggestions: [
      "Би юу үзэх вэ?",
      "Миний progress хэд вэ?",
      "Certificate авахад юу дутуу вэ?",
      "7 хоногийн study plan гарга",
    ],
    mode: "rule-based",
  };
}

// ── Public entry point ────────────────────────────────────────────────────────

export function generateRuleBasedAgentResponse(
  message: string,
  context: AgentContext,
  forcedIntent?: AgentIntent,
): AgentResponse {
  const intent = forcedIntent ?? detectAgentIntent(message);

  switch (intent) {
    case "CONTINUE_LEARNING":
      return handleContinueLearning(context);
    case "EXPLAIN_PROGRESS":
      return handleExplainProgress(context);
    case "CERTIFICATE_STATUS":
      return handleCertificateStatus(context);
    case "CREATE_STUDY_PLAN":
      return handleCreateStudyPlan(context);
    case "RECOMMEND_COURSE":
      return handleRecommendCourse(context);
    case "TASK_HELP":
      return handleTaskHelp(context);
    case "FIND_COURSE":
      return handleFindCourse();
    case "LESSON_HELP":
      return handleLessonHelp(context);
    case "GENERAL_HELP":
    default:
      return handleGeneralHelp(context);
  }
}
