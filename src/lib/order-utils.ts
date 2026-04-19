import { prisma } from "./prisma";

export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const startOfYear = new Date(year, 0, 1);

  const count = await prisma.order.count({
    where: { createdAt: { gte: startOfYear } },
  });

  const seq = String(count + 1).padStart(4, "0");
  return `ORD-${year}-${seq}`;
}

type OrderAction = "approve" | "reject" | "ship" | "deliver" | "pay";

const validTransitions: Record<string, OrderAction[]> = {
  PENDING: ["approve", "reject"],
  APPROVED: ["ship"],
  SHIPPED: ["deliver"],
  DELIVERED: ["pay"],
};

export function canTransition(
  currentStatus: string,
  action: OrderAction
): boolean {
  return validTransitions[currentStatus]?.includes(action) ?? false;
}
