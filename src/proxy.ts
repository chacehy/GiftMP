import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 renamed the `middleware` file convention to `proxy`
// (https://nextjs.org/docs/messages/middleware-to-proxy). This is the
// project's edge-level auth/role gate; it is defense-in-depth only —
// every seller/admin Server Action must independently re-verify the
// caller's role (see src/lib/auth-guard.ts) since a Proxy matcher change
// or refactor can silently stop covering a route.
export async function proxy(request: NextRequest) {
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    }
  );

  const pathname = request.nextUrl.pathname;
  const role = (session?.user as { role?: string } | undefined)?.role ?? "BUYER";

  const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const isAdminRoute = pathname.startsWith("/admin");
  const isSellerRoute = pathname.startsWith("/dashboard");
  const isProtectedRoute =
    isAdminRoute ||
    isSellerRoute ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/orders");

  // Unauthenticated visitors to any protected route go to sign-in.
  if (!session && isProtectedRoute) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Only admins may reach the admin panel.
  if (session && isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Only sellers/admins may reach the seller dashboard.
  if (session && isSellerRoute && role !== "SELLER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Signed-in users don't need the sign-in/sign-up pages.
  if (session && isAuthPage) {
    const destination = role === "ADMIN" ? "/admin" : role === "SELLER" ? "/dashboard" : "/";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
