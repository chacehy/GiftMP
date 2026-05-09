import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";

export const auth = betterAuth({
  database: prismaAdapter({}, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }, request) => {},
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {},
  }
});
