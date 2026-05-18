import { db } from "@/lib/db";

/** Google OAuth-оор имэйл баталгаажсан хэрэглэгчийг идэвхжүүлнэ (verify-email алгасна). */
export async function activateGoogleUser(userId: string, verifiedAt?: Date | string | null) {
  await db.user.update({
    where: { id: userId },
    data: {
      status: "ACTIVE",
      emailVerified: verifiedAt ? new Date(verifiedAt) : new Date(),
    },
    select: { id: true },
  });
}
