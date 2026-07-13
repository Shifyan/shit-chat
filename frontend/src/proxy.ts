import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Development toggle: set to true to bypass session protection checks
const BYPASS_AUTH = false;

/**
 * Next.js Middleware route-guard.
 * Prevents non-authenticated users from entering protected paths like the chat dashboard.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect index route which is our message chat layout page
  const isProtectedPath = pathname === "/";

  if (isProtectedPath && !BYPASS_AUTH) {
    // Check for active token cookie
    const token = request.cookies.get("token")?.value;

    if (!token) {
      // Redirect unauthorized user to /login
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
