import { SignJWT } from "jose";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

function getSocketSecret() {
  const secret = process.env.SOCKET_AUTH_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("SOCKET_AUTH_SECRET, AUTH_SECRET, or NEXTAUTH_SECRET must be configured");
  }

  return new TextEncoder().encode(secret);
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await new SignJWT({
    userId: session.user.id,
    role: session.user.role,
    organizationId: session.user.organizationId,
    name: session.user.name,
    image: session.user.image,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.user.id)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSocketSecret());

  return NextResponse.json({ token });
}
