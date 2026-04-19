import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalCustomers, totalProducts, pendingOrders, payments] =
      await Promise.all([
        prisma.customer.count({ where: { status: "ACTIVE" } }),
        prisma.product.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.payment.findMany({
          select: { amount: true, method: true },
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

    return NextResponse.json({
      totalCustomers,
      totalProducts,
      pendingOrders,
      balance: {
        cash,
        bank,
        mobile,
        total: cash + bank + mobile,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch dashboard", detail: message },
      { status: 500 }
    );
  }
}
