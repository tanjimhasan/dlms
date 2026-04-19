"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: string;
  customer: { name: string };
  payment: {
    amount: string;
    method: string;
    reference: string | null;
    receivedAt: string;
    receivedByUser: { name: string };
  };
}

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/orders?status=PAID&limit=50");
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Payments</h1>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Received By</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No payments found.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/orders/${o.id}`} className="text-blue-600 hover:underline font-medium">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{o.customer.name}</td>
                    <td className="px-4 py-3">{Number(o.payment.amount).toLocaleString()}</td>
                    <td className="px-4 py-3">{o.payment.method.replace("_", " ")}</td>
                    <td className="px-4 py-3">{o.payment.reference || "-"}</td>
                    <td className="px-4 py-3">{o.payment.receivedByUser.name}</td>
                    <td className="px-4 py-3">
                      {new Date(o.payment.receivedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
