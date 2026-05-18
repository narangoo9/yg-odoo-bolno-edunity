import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CreateYouTubeCourseForm } from "@/components/course/CreateYouTubeCourseForm";

export const metadata: Metadata = { title: "Create Course from YouTube" };

export default async function NewCoursePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["COMPANY", "COMPANY", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/student");
  }

  return (
    <div className="max-w-4xl animate-fade-up">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Create Course from YouTube</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste one YouTube URL, parse timestamp sections, then save a draft course.
        </p>
      </div>
      <CreateYouTubeCourseForm />
    </div>
  );
}
