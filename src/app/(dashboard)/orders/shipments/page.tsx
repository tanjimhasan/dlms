"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  customer: { name: string };
  shipment: {
    shippedAt: string;
    deliveredAt: string | null;
    shippedByUser: { name: string };
  };
}

export default function ShipmentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    if (statusFilter) params.set("status", statusFilter);
    else params.set("status", "SHIPPED");
    const res = await fetch(`/api/orders?${params}`);
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  async function fetchAll() {
    setLoading(true);
    const [shipped, delivered, paid] = await Promise.all([
      fetch("/api/orders?status=SHIPPED&limit=50").then((r) => r.json()),
      fetch("/api/orders?status=DELIVERED&limit=50").then((r) => r.json()),
      fetch("/api/orders?status=PAID&limit=50").then((r) => r.json()),
    ]);
    const all = [...(shipped.orders || []), ...(delivered.orders || []), ...(paid.orders || [])];
    all.sort((a: Order, b: Order) => new Date(b.shipment?.shippedAt || 0).getTime() - new Date(a.shipment?.shippedAt || 0).getTime());
    setOrders(all);
    setLoading(false);
  }

  useEffect(() => {
    if (!statusFilter) fetchAll();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Shipments</h1>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Shipped</option>
            <option value="SHIPPED">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="PAID">Completed</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Shipped By</th>
                <th className="px-4 py-3 font-medium">Shipped Date</th>
                <th className="px-4 py-3 font-medium">Delivery Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No shipments found.
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
                    <td className="px-4 py-3">{o.shipment?.shippedByUser?.name || "-"}</td>
                    <td className="px-4 py-3">
                      {o.shipment?.shippedAt
                        ? new Date(o.shipment.shippedAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {o.shipment?.deliveredAt
                        ? new Date(o.shipment.deliveredAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3">{o.status}</td>
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
