"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: string;
  createdAt: string;
  customer: { name: string; phone: string };
  createdByUser: { name: string };
  _count: { items: number };
}

export default function PendingOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/orders?status=PENDING&limit=50");
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function handleAction(id: string, action: string, extra: Record<string, string> = {}) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== id));
        setRejectingId(null);
        setRejectionReason("");
      } else {
        const { error } = await res.json();
        alert(error || "Action failed");
      }
    } catch {
      alert("Something went wrong");
    }
    setActionLoading(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Pending Approvals</h1>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Created By</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Actions</th>
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
                    No pending orders.
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
                    <td className="px-4 py-3">{o._count.items}</td>
                    <td className="px-4 py-3">{Number(o.totalAmount).toLocaleString()}</td>
                    <td className="px-4 py-3">{o.createdByUser.name}</td>
                    <td className="px-4 py-3">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {rejectingId === o.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Reason..."
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-32"
                          />
                          <button
                            onClick={() => handleAction(o.id, "reject", { rejectionReason })}
                            disabled={actionLoading === o.id || !rejectionReason}
                            className="text-red-600 text-xs hover:underline disabled:opacity-50 cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setRejectionReason(""); }}
                            className="text-gray-500 text-xs hover:underline cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(o.id, "approve")}
                            disabled={actionLoading === o.id}
                            className="text-green-600 text-sm hover:underline disabled:opacity-50 cursor-pointer"
                          >
                            {actionLoading === o.id ? "..." : "Approve"}
                          </button>
                          <button
                            onClick={() => setRejectingId(o.id)}
                            className="text-red-600 text-sm hover:underline cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      )}
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
