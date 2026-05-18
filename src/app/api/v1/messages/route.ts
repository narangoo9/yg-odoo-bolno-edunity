import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { toChatUuid } from "@/lib/supabase/chat-identity";

const messageSelect = "id, conversation_id, sender_id, content, created_at, read_at";

const querySchema = z.object({
  conversationId: z.string().uuid(),
  courseId: z.string().min(1),
  after: z.string().datetime().optional(),
});

const postSchema = z.object({
  conversationId: z.string().uuid(),
  courseId: z.string().min(1),
  content: z.string().trim().min(1).max(2000),
});

async function canAccessCourse(courseId: string, userId: string) {
  const [enrollment, course] = await Promise.all([
    db.enrollment.findFirst({
      where: {
        courseId,
        studentId: userId,
        status: { in: ["ACTIVE", "COMPLETED"] },
      },
      select: { id: true },
    }),
    db.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        instructorId: true,
        instructor: { select: { id: true } },
      },
    }),
  ]);

  if (!course) return null;
  if (course.instructorId !== userId && !enrollment) return null;
  return course;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = querySchema.safeParse({
    conversationId: req.nextUrl.searchParams.get("conversationId"),
    courseId: req.nextUrl.searchParams.get("courseId"),
    after: req.nextUrl.searchParams.get("after") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const course = await canAccessCourse(parsed.data.courseId, session.user.id);
  if (!course || parsed.data.conversationId !== toChatUuid(`course:${course.id}`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase service role is not configured" }, { status: 500 });
  }

  let query = supabase
    .from("messages")
    .select(messageSelect)
    .eq("conversation_id", parsed.data.conversationId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (parsed.data.after) {
    query = query.gt("created_at", parsed.data.after);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const course = await canAccessCourse(parsed.data.courseId, session.user.id);
  if (!course || parsed.data.conversationId !== toChatUuid(`course:${course.id}`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase service role is not configured" }, { status: 500 });
  }

  const chatUserId = toChatUuid(session.user.id);
  await supabase.from("conversations").upsert(
    {
      id: parsed.data.conversationId,
      kind: "course",
      course_id: course.id,
      title: course.title,
      created_by: toChatUuid(course.instructor.id),
    },
    { onConflict: "id" },
  );
  await supabase.from("conversation_members").upsert(
    {
      conversation_id: parsed.data.conversationId,
      user_id: chatUserId,
      role: course.instructorId === session.user.id ? "instructor" : "member",
    },
    { onConflict: "conversation_id,user_id" },
  );

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: parsed.data.conversationId,
      sender_id: chatUserId,
      content: parsed.data.content,
    })
    .select(messageSelect)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: data });
}
