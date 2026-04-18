import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ customers });
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const body = await request.json();

    const { name, phone, area, status, totalDue } = body;

    if (!name || !phone || !area) {
      return NextResponse.json(
        { error: "Name, phone, and area are required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        area,
        status: status || "ACTIVE",
        totalDue: totalDue ? parseFloat(totalDue) : 0,
        createdBy: userId,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create customer error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create customer", detail: message },
      { status: 500 }
    );
  }
}
