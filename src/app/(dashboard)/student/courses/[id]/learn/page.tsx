import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { LearningPlayer } from "@/components/course/LearningPlayer";
import { YouTubeCoursePlayer } from "@/components/course/YouTubeCoursePlayer";
import { CourseReviews } from "@/components/course/CourseReviews";
import { trackLessonView } from "@/modules/courses/application/actions";
import { canAccessLearningItem, getMarketplacePlan } from "@/lib/marketplace-access";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lessonId?: string }>;
}

export default async function LearnPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: courseId } = await params;
  const { lessonId: qLessonId } = await searchParams;

  const [subscription, enrollment] = await Promise.all([
    db.subscription.findUnique({
      where: { userId: session.user.id },
      select: { plan: true, status: true },
    }),
    db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: session.user.id, courseId } },
    }),
  ]);

  if (!enrollment) redirect("/courses");
  const accessPlan = getMarketplacePlan(subscription?.plan, subscription?.status);

  // Load full course with progress + reviews in parallel
  const [course, reviews, progress] = await Promise.all([
    db.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          orderBy: { order: "asc" },
        },
        modules: {
          orderBy: { orderIndex: "asc" },
          include: {
            lessons: {
              orderBy: { orderIndex: "asc" },
              include: {
                sections: {
                  orderBy: { order: "asc" },
                  include: {
                    completions: {
                      where: { studentId: session.user.id },
                      select: { id: true, completedAt: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    db.review.findMany({
      where: { courseId },
      include: { student: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.progress.findMany({
      where: { studentId: session.user.id, courseId },
      select: { lessonId: true, isCompleted: true, watchedSeconds: true },
    }),
  ]);
  if (!course) notFound();

  if (course.sourceType === "YOUTUBE" && course.sourceYoutubeId) {
    if (course.status !== "PUBLISHED" && course.instructorId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
      notFound();
    }

    return (
      <YouTubeCoursePlayer
        course={{
          id: course.id,
          title: course.title,
          sourceYoutubeId: course.sourceYoutubeId,
          sections: course.sections,
        }}
        accessPlan={accessPlan}
      />
    );
  }

  // Determine active lesson
  const allLessons = course.modules.flatMap((m) => m.lessons);
  if (allLessons.length === 0) notFound();

  const activeLessonId = qLessonId ?? allLessons[0].id;
  const activeLesson = allLessons.find((l) => l.id === activeLessonId) ?? allLessons[0];
  const activeLessonIndex = allLessons.findIndex((lesson) => lesson.id === activeLesson.id);

  if (!canAccessLearningItem(accessPlan, activeLessonIndex, allLessons.length)) {
    redirect("/student/upgrade");
  }

  const unlockedModules = course.modules.map((module) => ({
    ...module,
    lessons: module.lessons.map((lesson) => {
      const lessonIndex = allLessons.findIndex((item) => item.id === lesson.id);

      return {
        ...lesson,
        isLocked: !canAccessLearningItem(accessPlan, lessonIndex, allLessons.length),
      };
    }),
  }));

  const completedIds = new Set(progress.filter((p) => p.isCompleted).map((p) => p.lessonId));
  const totalLessons = allLessons.length;
  const completedCount = completedIds.size;

  void trackLessonView(activeLesson.id, courseId, enrollment.id);

  const myReview = reviews.find((r) => r.student.id === session.user.id) ?? null;

  return (
    <div className="space-y-6">
      <LearningPlayer
        course={{
          id: course.id,
          title: course.title,
          modules: unlockedModules,
        }}
        activeLesson={activeLesson}
        completedIds={Array.from(completedIds)}
        progressPercent={totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0}
        studentId={session.user.id}
      />
      <div className="max-w-4xl">
        <CourseReviews
          courseId={courseId}
          reviews={reviews}
          currentUserId={session.user.id}
          myReview={myReview}
          canReview={true}
        />
      </div>
    </div>
  );
}
