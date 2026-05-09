import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "./prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // ─── Email & Password Auth ───
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      await resend.emails.send({
        from: "Etsy Clone <onboarding@resend.dev>",
        to: user.email,
        subject: "Reset your password",
        html: `<p>Click the link to reset your password: <a href="${url}">${url}</a></p>`,
      });
    },
  },

  // ─── Email Verification ───
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      try {
        console.log("Attempting to send verification email to:", user.email);
        const { data, error } = await resend.emails.send({
          from: "Etsy Clone <onboarding@resend.dev>",
          to: user.email,
          subject: "Verify your email address",
          html: `<p>Click the link to verify your email: <a href="${url}">${url}</a></p>`,
        });
        if (error) {
          console.error("Resend API Error:", error);
        } else {
          console.log("Email sent successfully:", data);
        }
      } catch (err) {
        console.error("Failed to send verification email:", err);
      }
    },
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
