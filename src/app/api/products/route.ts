import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: { select: { name: true } } },
    });
    return NextResponse.json({ products });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch products", detail: message },
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
    const {
      name,
      sku,
      description,
      categoryId,
      brand,
      tags,
      actualPrice,
      sellingPrice,
      trackInventory,
      minimumStockLevel,
      unit,
    } = body;

    if (!name || actualPrice == null || sellingPrice == null) {
      return NextResponse.json(
        { error: "Name, actual price, and selling price are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku: sku || null,
        description: description || null,
        categoryId: categoryId || null,
        brand: brand || null,
        tags: tags || null,
        actualPrice: parseFloat(actualPrice),
        sellingPrice: parseFloat(sellingPrice),
        trackInventory: trackInventory ?? false,
        minimumStockLevel: minimumStockLevel ? parseInt(minimumStockLevel) : null,
        unit: unit || "PCS",
        createdBy: userId,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create product error:", error);
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return NextResponse.json(
        { error: "Product name already exists" },
        { status: 409 }
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create product", detail: message },
      { status: 500 }
    );
  }
}
