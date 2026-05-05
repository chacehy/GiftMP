import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // ─── Email & Password Auth ───
  emailAndPassword: {
    enabled: true,
  },

  // ─── Session config ───
  session: {
    // Sessions expire after 7 days of inactivity
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    // Refresh session if less than 1 day remains
    updateAge: 60 * 60 * 24, // 1 day in seconds
  },

  // ─── User fields ───
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "BUYER",
        input: false, // Not settable from client during sign-up
      },
    },
  },
});

// Export the auth type for use in other files
export type Session = typeof auth.$Infer.Session;
