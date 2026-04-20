import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalCustomers,
      totalProducts,
      pendingOrders,
      payments,
      products,
      stockIns,
      orderItems,
      damages,
      customerDue,
      unpaidOrders,
    ] = await Promise.all([
      prisma.customer.count({ where: { status: "ACTIVE" } }),
      prisma.product.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.payment.findMany({ select: { amount: true, method: true } }),
      prisma.product.findMany({ select: { stock: true, actualPrice: true } }),
      prisma.stockIn.findMany({
        select: { quantity: true, product: { select: { actualPrice: true } } },
      }),
      prisma.orderItem.aggregate({ _sum: { totalPrice: true } }),
      prisma.damage.findMany({
        select: { quantity: true, product: { select: { actualPrice: true } } },
      }),
      prisma.customer.aggregate({ _sum: { totalDue: true } }),
      prisma.order.aggregate({
        where: { status: { in: ["PENDING", "APPROVED", "SHIPPED", "DELIVERED"] } },
        _sum: { totalAmount: true },
      }),
    ]);

    let cash = 0;
    let bank = 0;
    let mobile = 0;

    for (const p of payments) {
      const amount = Number(p.amount);
      if (p.method === "CASH") cash += amount;
      else if (p.method === "BANK_TRANSFER" || p.method === "CHEQUE") bank += amount;
      else if (p.method === "MOBILE_BANKING") mobile += amount;
    }

    const availableStock = products.reduce(
      (sum, p) => sum + p.stock * Number(p.actualPrice),
      0
    );

    const purchasedStock = stockIns.reduce(
      (sum, s) => sum + s.quantity * Number(s.product.actualPrice),
      0
    );

    const saleStock = Number(orderItems._sum.totalPrice ?? 0);

    const damageStock = damages.reduce(
      (sum, d) => sum + d.quantity * Number(d.product.actualPrice),
      0
    );

    return NextResponse.json({
      totalCustomers,
      totalProducts,
      pendingOrders,
      balance: { cash, bank, mobile, total: cash + bank + mobile },
      stock: { availableStock, purchasedStock, saleStock, damageStock },
      totalCustomerDue: Number(customerDue._sum.totalDue ?? 0),
      totalDue: Number(unpaidOrders._sum.totalAmount ?? 0),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch dashboard", detail: message },
      { status: 500 }
    );
  }
}
