import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { QuizTaker } from "@/components/quiz/QuizTaker";

interface Props { params: Promise<{ id: string }> }

export default async function QuizTakePage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: quizId } = await params;

  const quiz = await db.quiz.findUnique({
    where: { id: quizId, isActive: true },
    include: {
      course: { select: { id: true, title: true } },
      questions: {
        orderBy: { orderIndex: "asc" },
        include: { options: { orderBy: { orderIndex: "asc" } } },
      },
    },
  });
  if (!quiz) notFound();

  // Check enrollment
  const enrollment = await db.enrollment.findUnique({
    where: { studentId_courseId: { studentId: session.user.id, courseId: quiz.courseId } },
  });
  if (!enrollment) redirect("/courses");

  // Previous attempts
  const attempts = await db.quizAttempt.findMany({
    where: { quizId, studentId: session.user.id },
    orderBy: { startedAt: "desc" },
  });

  const canRetake = attempts.length < quiz.maxAttempts;
  const bestAttempt = attempts
    .filter((a) => a.status === "GRADED")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];

  return (
    <QuizTaker
      quiz={{
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        maxAttempts: quiz.maxAttempts,
        courseTitle: quiz.course.title,
        courseId: quiz.course.id,
        questionCount: quiz.questions.length,
        totalPoints: quiz.questions.reduce((s, q) => s + q.points, 0),
      }}
      attemptsUsed={attempts.length}
      canRetake={canRetake}
      bestScore={bestAttempt?.score ?? null}
      bestMaxScore={bestAttempt?.maxScore ?? null}
    />
  );
}
