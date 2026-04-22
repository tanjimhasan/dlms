import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type OrderAction = "approve" | "reject" | "ship" | "deliver" | "pay" | "pay_partial";

const validTransitions: Record<string, OrderAction[]> = {
  PENDING: ["approve", "reject"],
  APPROVED: ["ship"],
  SHIPPED: ["deliver"],
  DELIVERED: ["pay", "pay_partial"],
  PAID_PARTIAL: ["pay", "pay_partial"],
};

function canTransition(currentStatus: string, action: OrderAction): boolean {
  return validTransitions[currentStatus]?.includes(action) ?? false;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        createdByUser: { select: { name: true } },
        reviewedByUser: { select: { name: true } },
        items: true,
        shipment: { include: { shippedByUser: { select: { name: true } } } },
        payment: {
          orderBy: { receivedAt: 'desc' },
          include: { receivedByUser: { select: { name: true } } },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const totalPaid = order.payment.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    const formattedOrder = {
      ...order,
      payments: order.payment ?? null,
      totalPaid,
      dueAmount: Math.max(Number(order.totalAmount) - totalPaid, 0),
    };

    return NextResponse.json({ order: formattedOrder });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch order", detail: message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only admin can update orders" }, { status: 403 });
    }

    const body = await request.json();
    const { action, rejectionReason, deliveryNotes, paymentMethod, paidAmount, paymentReference, paymentNotes } = body;
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, customer: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!canTransition(order.status, action)) {
      return NextResponse.json(
        { error: `Cannot ${action} order in ${order.status} status` },
        { status: 400 }
      );
    }

    let updated;

    if (action === "approve") {
      const insufficientItems: string[] = [];
      for (const item of order.items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product?.trackInventory && product.stock < item.quantity) {
          insufficientItems.push(`${product.name}: need ${item.quantity}, have ${product.stock}`);
        }
      }
      if (insufficientItems.length > 0) {
        return NextResponse.json(
          { error: "Insufficient stock", items: insufficientItems },
          { status: 400 }
        );
      }

      updated = await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product?.trackInventory) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }
        return tx.order.update({
          where: { id },
          data: { status: "APPROVED", reviewedBy: userId },
        });
      });
    } else if (action === "reject") {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: "Rejection reason is required" },
          { status: 400 }
        );
      }
      updated = await prisma.order.update({
        where: { id },
        data: { status: "REJECTED", reviewedBy: userId, rejectionReason },
      });
    } else if (action === "ship") {
      updated = await prisma.$transaction(async (tx) => {
        const shipment = await tx.shipment.create({
          data: { orderId: id, shippedBy: userId, deliveryNotes: deliveryNotes || null },
        });
        return tx.order.update({
          where: { id },
          data: { status: "SHIPPED" },
          include: { shipment: true },
        });
      });
    } else if (action === "deliver") {
      updated = await prisma.$transaction(async (tx) => {
        await tx.shipment.update({
          where: { orderId: id },
          data: { deliveredAt: new Date() },
        });
        return tx.order.update({
          where: { id },
          data: { status: "DELIVERED" },
        });
      });
    } else if (action === "pay") {
      if (!paymentMethod) {
        return NextResponse.json(
          { error: "Payment method is required" },
          { status: 400 }
        );
      }

      const normalizedPaidAmount = Number(paidAmount);
      if (!Number.isFinite(normalizedPaidAmount) || normalizedPaidAmount <= 0) {
        return NextResponse.json(
          { error: "A valid payment amount is required" },
          { status: 400 }
        );
      }

      updated = await prisma.$transaction(async (tx) => {
        const totals = await tx.payment.aggregate({
          where: { orderId: id },
          _sum: { amount: true },
        });

        const totalPaidBefore = Number(totals._sum.amount ?? 0);
        const orderTotal = Number(order.totalAmount);
        const remainingDue = Math.max(orderTotal - totalPaidBefore, 0);

        if (remainingDue <= 0) {
          throw new Error("This order has already been fully paid");
        }

        if (normalizedPaidAmount > remainingDue) {
          throw new Error(`Payment exceeds remaining due of ${remainingDue}`);
        }

        await tx.payment.create({
          data: {
            orderId: id,
            amount: normalizedPaidAmount,
            method: paymentMethod,
            reference: paymentReference || null,
            receivedBy: userId,
            notes: paymentNotes || null,
          },
        });

        const totalPaidAfter = totalPaidBefore + normalizedPaidAmount;
        const nextStatus = totalPaidAfter >= orderTotal ? "PAID" : "PAID_PARTIAL";
        const customer = await tx.customer.findUnique({
          where: { id: order.customerId },
          select: { totalDue: true },
        });

        if (customer) {
          await tx.customer.update({
            where: { id: order.customerId },
            data: {
              totalDue: Math.max(Number(customer.totalDue) - normalizedPaidAmount, 0),
            },
          });
        }

        return tx.order.update({
          where: { id },
          data: { status: nextStatus },
        });
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ order: updated });
  } catch (error: unknown) {
    console.error("Update order error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    if (
      message === "This order has already been fully paid" ||
      message.startsWith("Payment exceeds remaining due of")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update order", detail: message },
      { status: 500 }
    );
  }
}
