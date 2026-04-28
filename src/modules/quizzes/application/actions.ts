"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidateUserNotifications } from "@/lib/dashboard-cache";
import { createQuizSchema, createQuestionSchema, submitQuizSchema } from "../domain/schemas";
import type { CreateQuizInput, CreateQuestionInput, SubmitQuizInput } from "../domain/schemas";

export async function createQuiz(input: CreateQuizInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Нэвтрэх шаардлагатай");

  const parsed = createQuizSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const course = await db.course.findUnique({ where: { id: parsed.data.courseId } });
  if (!course || course.instructorId !== session.user.id) return { error: "Эрхгүй" };

  const quiz = await db.quiz.create({ data: parsed.data });

  revalidatePath(`/instructor/courses/${parsed.data.courseId}`);
  return { success: true, data: quiz };
}

export async function addQuestion(input: CreateQuestionInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Нэвтрэх шаардлагатай");

  const parsed = createQuestionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const quiz = await db.quiz.findUnique({
    where: { id: parsed.data.quizId },
    include: { course: true },
  });
  if (!quiz || quiz.course.instructorId !== session.user.id) return { error: "Эрхгүй" };

  const lastQ = await db.question.findFirst({
    where: { quizId: parsed.data.quizId },
    orderBy: { orderIndex: "desc" },
  });

  const { options, ...questionData } = parsed.data;

  const question = await db.question.create({
    data: {
      ...questionData,
      orderIndex: (lastQ?.orderIndex ?? -1) + 1,
      options: options
        ? {
            create: options.map((opt, i) => ({ ...opt, orderIndex: i })),
          }
        : undefined,
    },
    include: { options: true },
  });

  return { success: true, data: question };
}

export async function startQuizAttempt(quizId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Нэвтрэх шаардлагатай");

  const quiz = await db.quiz.findUnique({
    where: { id: quizId, isActive: true },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
        include: { options: { orderBy: { orderIndex: "asc" } } },
      },
    },
  });
  if (!quiz) return { error: "Шалгалт олдсонгүй" };

  const previousAttempts = await db.quizAttempt.count({
    where: { quizId, studentId: session.user.id },
  });
  if (previousAttempts >= quiz.maxAttempts) {
    return { error: `Оролдлогын тоо хэтэрлээ (дээд хязгаар: ${quiz.maxAttempts})` };
  }

  const attempt = await db.quizAttempt.create({
    data: {
      quizId,
      studentId: session.user.id,
      status: "IN_PROGRESS",
      maxScore: quiz.questions.reduce((sum, q) => sum + q.points, 0),
    },
  });

  const questions = quiz.randomOrder
    ? [...quiz.questions].sort(() => Math.random() - 0.5)
    : quiz.questions;

  return {
    success: true,
    data: {
      attempt,
      questions: questions.map((q) => ({
        id: q.id,
        type: q.type,
        text: q.text,
        points: q.points,
        mediaUrl: q.mediaUrl,
        options: q.options.map((o) => ({ id: o.id, text: o.text })),
      })),
      timeLimit: quiz.timeLimit,
    },
  };
}

export async function submitQuiz(input: SubmitQuizInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Нэвтрэх шаардлагатай");

  const parsed = submitQuizSchema.safeParse(input);
  if (!parsed.success) return { error: "Буруу оролт" };

  const attempt = await db.quizAttempt.findUnique({
    where: { id: parsed.data.attemptId, studentId: session.user.id, status: "IN_PROGRESS" },
    include: {
      quiz: {
        include: {
          questions: { include: { options: true } },
        },
      },
    },
  });
  if (!attempt) return { error: "Оролдлого олдсонгүй эсвэл аль хэдийн дуусгасан" };

  let totalScore = 0;
  const answerCreates = [];

  for (const answer of parsed.data.answers) {
    const question = attempt.quiz.questions.find((q) => q.id === answer.questionId);
    if (!question) continue;

    let isCorrect = false;
    let pointsEarned = 0;

    if (question.type === "MULTIPLE_CHOICE") {
      const correctIds = question.options.filter((o) => o.isCorrect).map((o) => o.id);
      isCorrect =
        answer.selectedIds.length === correctIds.length &&
        correctIds.every((id) => answer.selectedIds.includes(id));
    } else if (["SINGLE_CHOICE", "TRUE_FALSE"].includes(question.type)) {
      const correctOption = question.options.find((o) => o.isCorrect);
      isCorrect = correctOption?.id === answer.selectedIds[0];
    } else if (question.type === "SHORT_ANSWER") {
      isCorrect = false;
    }

    if (isCorrect) {
      pointsEarned = question.points;
      totalScore += pointsEarned;
    }

    answerCreates.push({
      attemptId: attempt.id,
      questionId: answer.questionId,
      selectedIds: answer.selectedIds,
      textAnswer: answer.textAnswer,
      isCorrect,
      pointsEarned,
    });
  }

  const maxScore = attempt.maxScore ?? 0;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const passed = maxScore > 0 && percentage >= attempt.quiz.passingScore;

  const timeTaken = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);

  await db.$transaction([
    db.quizAnswer.createMany({ data: answerCreates }),
    db.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        score: totalScore,
        status: "GRADED",
        submittedAt: new Date(),
        timeTaken,
      },
    }),
  ]);

  await db.notification.create({
    data: {
      userId: session.user.id,
      type: "QUIZ_RESULT",
      title: passed ? "Шалгалт тэнцлээ! 🎉" : "Шалгалт тэнцсэнгүй",
      body: `Оноо: ${totalScore}/${maxScore}. ${passed ? "Баяр хүргэе!" : "Дахин оролдоно уу."}`,
      data: { quizId: attempt.quizId, attemptId: attempt.id },
    },
  });
  revalidateUserNotifications(session.user.id);

  revalidatePath(`/student/courses`);
  return {
    success: true,
    data: {
      score: totalScore,
      maxScore,
      passed,
      percentage,
    },
  };
}
