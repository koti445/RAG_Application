import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  AUTH_ROUTES,
  PROTECTED_ROUTES,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/constants";
import { hasValidAccessToken } from "@/lib/auth/jwt";

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function hasAnyAuthCookie(request: NextRequest): boolean {
  return (
    request.cookies.has(ACCESS_TOKEN_COOKIE) || request.cookies.has(REFRESH_TOKEN_COOKIE)
  );
}

function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const hasRefresh = request.cookies.has(REFRESH_TOKEN_COOKIE);
  const hasValidAccess = hasValidAccessToken(accessToken);

  if (pathname === "/") {
    const dest = hasValidAccess || hasRefresh ? "/home" : "/login";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (isProtectedRoute(pathname) && !hasValidAccess && !hasRefresh) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute(pathname) && pathname !== "/auth/oauth/callback") {
    // Only skip login when access token is actually valid — stale cookies caused redirect loops.
    if (hasValidAccess) {
      return NextResponse.redirect(new URL("/home", request.url));
    }

    if (hasAnyAuthCookie(request)) {
      return clearAuthCookies(NextResponse.next());
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
