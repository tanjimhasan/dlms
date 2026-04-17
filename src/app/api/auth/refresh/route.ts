import { NextRequest, NextResponse } from "next/server";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  COOKIE_OPTIONS,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: "No refresh token" },
      { status: 401 }
    );
  }

  try {
    const payload = await verifyRefreshToken(refreshToken);
    const tokenPayload = { userId: payload.userId, role: payload.role };

    const newAccessToken = await generateAccessToken(tokenPayload);
    const newRefreshToken = await generateRefreshToken(tokenPayload);

    const response = NextResponse.json({ success: true });
    response.cookies.set("access_token", newAccessToken, COOKIE_OPTIONS.access);
    response.cookies.set("refresh_token", newRefreshToken, COOKIE_OPTIONS.refresh);

    return response;
  } catch {
    const response = NextResponse.json(
      { error: "Invalid refresh token" },
      { status: 401 }
    );
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");
    return response;
  }
}
