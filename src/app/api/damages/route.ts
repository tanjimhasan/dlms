import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const damages = await prisma.damage.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true, sku: true, sellingPrice: true } },
        createdByUser: { select: { name: true } },
      },
    });
    return NextResponse.json({ damages });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch damages", detail: message },
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
    const { productId, quantity, reason, notes } = body;

    if (!productId || !quantity || quantity <= 0 || !reason) {
      return NextResponse.json(
        { error: "Product, quantity, and reason are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.trackInventory && product.stock < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Current stock: ${product.stock}` },
        { status: 400 }
      );
    }

    const damage = await prisma.$transaction(async (tx) => {
      if (product.trackInventory) {
        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: quantity } },
        });
      }
      return tx.damage.create({
        data: {
          productId,
          quantity,
          reason,
          notes: notes || null,
          createdBy: userId,
        },
        include: {
          product: { select: { name: true } },
          createdByUser: { select: { name: true } },
        },
      });
    });

    return NextResponse.json({ damage }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create damage error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create damage", detail: message },
      { status: 500 }
    );
  }
}
