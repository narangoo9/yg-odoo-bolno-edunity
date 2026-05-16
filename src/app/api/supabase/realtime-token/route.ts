import { SignJWT } from "jose";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toChatUuid } from "@/lib/supabase/chat-identity";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jwtSecret = process.env.SUPABASE_JWT_SECRET?.trim();

  if (!jwtSecret) {
    return NextResponse.json({ error: "SUPABASE_JWT_SECRET is not configured" }, { status: 500 });
  }

  const chatUserId = toChatUuid(session.user.id);
  const secret = new TextEncoder().encode(jwtSecret);
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;

  const token = await new SignJWT({
    aud: "authenticated",
    role: "authenticated",
    email: session.user.email,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(chatUserId)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret);

  return NextResponse.json({ token, userId: chatUserId, expiresAt });
}
