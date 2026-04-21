"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { taka } from "@/lib/format";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  dueAmount: string;
  createdAt: string;
  customer: { name: string; phone: string };
  createdByUser: { name: string };
  _count: { items: number };
  payment: {
    amount: string;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  PAID: "bg-gray-100 text-gray-800",
  PAID_PARTIAL: "bg-indigo-100 text-indigo-800",
};

export default function OrderListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchOrders = useCallback(
    async (page: number, searchTerm: string, status: string) => {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(status && { status }),
      });
      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setPagination(data.pagination);
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    fetchOrders(1, search, statusFilter);
  }, [fetchOrders, search, statusFilter]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchOrders(1, value, statusFilter);
    }, 400);
  }

  function goToPage(page: number) {
    fetchOrders(page, search, statusFilter);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <Link
          href="/orders/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          Create Order
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex gap-3">
          <input
            type="text"
            placeholder="Search by order # or customer..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 max-w-sm border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="PAID">Paid</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created By</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                    <td className="px-4 py-3">{o.customer.name}</td>
                    <td className="px-4 py-3">{o._count.items}</td>
                    <td className="px-4 py-3">{taka(Number(o.totalAmount))}</td>
                    <td className="px-4 py-3">{taka(Number(o.totalAmount) - Number(o.payment?.amount || 0))}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[o.status] || "bg-gray-100"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{o.createdByUser.name}</td>
                    <td className="px-4 py-3">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/${o.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-40 cursor-pointer"
              >
                Prev
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`px-3 py-1 rounded border text-sm cursor-pointer ${
                      p === pagination.page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
