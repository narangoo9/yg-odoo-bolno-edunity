import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import type { PrismaClient } from "@prisma/client";

type UserWriteInput = AdapterUser & { image?: string | null };

function mapUserWriteData(user: UserWriteInput) {
  const { image, ...rest } = user;
  return {
    ...rest,
    avatarUrl: image ?? (rest as { avatarUrl?: string | null }).avatarUrl ?? null,
  };
}

/** Prisma User model uses avatarUrl; Auth.js OAuth profiles send image. */
export function createAuthAdapter(prisma: PrismaClient): Adapter {
  const base = PrismaAdapter(prisma) as Adapter;

  return {
    ...base,
    async createUser(user) {
      if (!base.createUser) {
        throw new Error("Prisma adapter createUser is not available");
      }
      return base.createUser(mapUserWriteData(user as UserWriteInput) as AdapterUser);
    },
    async updateUser(user) {
      if (!base.updateUser) {
        throw new Error("Prisma adapter updateUser is not available");
      }
      return base.updateUser(mapUserWriteData(user as UserWriteInput) as AdapterUser);
    },
  };
}
