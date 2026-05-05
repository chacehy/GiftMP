import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Try to get the session cookie
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    }
  );

  const isAuthPage = request.nextUrl.pathname.startsWith("/sign-in") || 
                     request.nextUrl.pathname.startsWith("/sign-up");

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard") || 
                           request.nextUrl.pathname.startsWith("/checkout") ||
                           request.nextUrl.pathname.startsWith("/orders");

  // Redirect to sign in if accessing a protected route without a session
  if (!session && isProtectedRoute) {
    const signInUrl = new URL("/sign-in", request.url);
    // Optional: add a redirect/callback URL query parameter
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to dashboard/home if accessing auth pages while already logged in
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply middleware to these routes
    "/dashboard/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
