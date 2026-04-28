import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NotesClient } from "@/components/student/NotesClient";

export const metadata: Metadata = { title: "Notes — EduNity" };

export default async function NotesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/student");

  return <NotesClient userId={session.user.id} />;
}
