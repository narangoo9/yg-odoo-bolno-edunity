import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateCourseForm } from "@/components/course/CreateCourseForm";

export const metadata: Metadata = { title: "Шинэ курс үүсгэх" };

export default async function NewCoursePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["INSTRUCTOR", "ORG_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/student");
  }
  return (
    <div className="max-w-2xl animate-fade-up">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Шинэ курс үүсгэх</h1>
        <p className="text-muted-foreground text-sm mt-1">Курсийн үндсэн мэдээллийг оруулна уу</p>
      </div>
      <CreateCourseForm />
    </div>
  );
}
