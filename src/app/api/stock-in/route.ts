import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const stockIns = await prisma.stockIn.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true, sku: true } },
        createdByUser: { select: { name: true } },
      },
    });
    return NextResponse.json({ stockIns });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch stock history", detail: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, quantity, notes } = body;

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Product and quantity are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const stockIn = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } },
      });
      return tx.stockIn.create({
        data: {
          productId,
          quantity,
          notes: notes || null,
          createdBy: userId,
        },
        include: {
          product: { select: { name: true } },
          createdByUser: { select: { name: true } },
        },
      });
    });

    return NextResponse.json({ stockIn }, { status: 201 });
  } catch (error: unknown) {
    console.error("Stock in error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to add stock", detail: message },
      { status: 500 }
    );
  }
}
