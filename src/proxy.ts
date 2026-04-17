import { NextRequest, NextResponse } from "next/server";
import {
  verifyAccessToken,
  verifyRefreshToken,
  generateAccessToken,
  COOKIE_OPTIONS,
} from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/refresh"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  let userId: string | undefined;
  let role: string | undefined;
  let shouldRefreshAccess = false;

  if (accessToken) {
    try {
      const payload = await verifyAccessToken(accessToken);
      userId = payload.userId;
      role = payload.role;
    } catch {
      shouldRefreshAccess = true;
    }
  }

  if (!userId && refreshToken) {
    try {
      const payload = await verifyRefreshToken(refreshToken);
      userId = payload.userId;
      role = payload.role;
      shouldRefreshAccess = true;
    } catch {
      // both tokens expired
    }
  }

  if (!userId || !role) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set("x-user-id", userId);
  response.headers.set("x-user-role", role);

  if (shouldRefreshAccess) {
    const newAccessToken = await generateAccessToken({ userId, role });
    response.cookies.set("access_token", newAccessToken, COOKIE_OPTIONS.access);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|sitemap.xml|robots.txt).*)",
  ],
};
