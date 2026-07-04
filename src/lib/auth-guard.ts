import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";

export type Role = UserRole;

async function getSessionWithRole() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = ((session?.user as { role?: Role } | undefined)?.role ?? UserRole.BUYER) as Role;
  return { session, role };
}

/**
 * Guard for Server Components / layouts / pages.
 * Redirects unauthenticated users to sign-in (with a callback) and
 * redirects authenticated users lacking the required role away entirely.
 */
export async function requireRole(allowed: Role[], path: string, forbiddenRedirect = "/") {
  const { session, role } = await getSessionWithRole();

  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(path)}`);
  }

  if (!allowed.includes(role)) {
    redirect(forbiddenRedirect);
  }

  return { session, role };
}

/**
 * Guard for Server Actions. Throws instead of redirecting so callers can
 * keep the existing try/catch -> { success: false, error } convention.
 * Per Next.js's data-security guidance, page-level auth checks do not
 * extend to Server Actions defined within them, so every seller/admin
 * action must re-verify on its own rather than relying on layout guards.
 */
export async function assertRole(allowed: Role[]) {
  const { session, role } = await getSessionWithRole();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!allowed.includes(role)) {
    throw new Error("Forbidden");
  }

  return { session, role };
}
