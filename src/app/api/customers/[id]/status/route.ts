import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        status: customer.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      },
    });

    return NextResponse.json({ customer: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to update status", detail: message },
      { status: 500 }
    );
  }
}
