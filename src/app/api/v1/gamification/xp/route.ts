// src/app/api/v1/gamification/xp/route.ts
// POST /api/v1/gamification/xp
// Хэрэглэгчид XP олгох — lesson дуусгах, quiz өгөх, streak гэх мэт

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { awardXP } from "@/modules/gamification/application/gamification-service";
import { ok, unauthorized, badRequest, serverError } from "@/shared/utils/api-response";
import { XpAction } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  action: z.nativeEnum(XpAction),
  entityId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid action");

    const result = await awardXP(
      session.user.id,
      parsed.data.action,
      parsed.data.entityId
    );

    // result = { xp: 1800, level: 6, leveledUp: false, newBadges: [] }
    return ok(result);
  } catch {
    return serverError();
  }
}
