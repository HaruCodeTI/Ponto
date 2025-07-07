import { UserRole } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      companyId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    companyId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
  }
}
