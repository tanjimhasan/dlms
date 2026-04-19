import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const count = await prisma.order.count({
    where: { createdAt: { gte: startOfYear } },
  });
  return `ORD-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          customer: { select: { name: true, phone: true } },
          createdByUser: { select: { name: true } },
          _count: { select: { items: true } },
          shipment: { include: { shippedByUser: { select: { name: true } } } },
          payment: { include: { receivedByUser: { select: { name: true } } } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch orders", detail: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (userRole !== "STOCK" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { customerId, notes, items } = body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Customer and at least one item are required" },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.productId) {
        return NextResponse.json(
          { error: "All items must have a product selected" },
          { status: 400 }
        );
      }
    }

    const productIds = items.map((item: { productId: string }) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const orderItems = items.map(
      (item: { productId: string; quantity: number }) => {
        const product = productMap.get(item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);
        const unitPrice = Number(product.sellingPrice);
        const totalPrice = unitPrice * item.quantity;
        return {
          productId: product.id,
          productName: product.name,
          unitPrice,
          quantity: item.quantity,
          totalPrice,
        };
      }
    );

    const totalAmount = orderItems.reduce(
      (sum: number, item: { totalPrice: number }) => sum + item.totalPrice,
      0
    );

    const orderNumber = await generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        totalAmount: totalAmount,
        notes: notes || null,
        createdBy: userId,
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: {
        items: true,
        customer: { select: { name: true } },
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create order error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create order", detail: message },
      { status: 500 }
    );
  }
}
