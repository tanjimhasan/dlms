import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const expectedToken = process.env.DEBUG_ADMIN_TOKEN;

  if (!expectedToken) {
    return NextResponse.json(
      { error: "Debug access is not configured" },
      { status: 404 }
    );
  }

  const providedToken = request.headers.get("x-debug-token");
  if (providedToken !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN" },
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    exists: admins.length > 0,
    count: admins.length,
    admins,
  });
}
