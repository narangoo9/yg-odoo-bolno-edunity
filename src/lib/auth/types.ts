import type { UserRole } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface User {
    role: UserRole;
    status: string;
    organizationId: string | null;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
      role: UserRole;
      status: string;
      organizationId: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    status: string;
    organizationId: string | null;
  }
}
