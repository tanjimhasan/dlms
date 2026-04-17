import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const role = request.headers.get("x-user-role");

  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, password, userRole } = body;

  if (!name || !email || !password || !userRole) {
    return NextResponse.json(
      { error: "Name, email, password, and role are required" },
      { status: 400 }
    );
  }

  if (!["SUPER_ADMIN", "STOCK"].includes(userRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email already exists" },
      { status: 409 }
    );
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role: userRole },
    select: { id: true, name: true, email: true, role: true, active: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const role = request.headers.get("x-user-role");

  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}
