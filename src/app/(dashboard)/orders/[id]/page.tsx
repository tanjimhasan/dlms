"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { taka } from "@/lib/format";

interface OrderItem {
  id: string;
  productName: string;
  unitPrice: string;
  quantity: number;
  totalPrice: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  notes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; name: string; phone: string; area: string };
  createdByUser: { name: string };
  reviewedByUser: { name: string } | null;
  items: OrderItem[];
  shipment: {
    shippedAt: string;
    deliveredAt: string | null;
    deliveryNotes: string | null;
    shippedByUser: { name: string };
  } | null;
  payment: {
    amount: string;
    method: string;
    reference: string | null;
    receivedAt: string;
    notes: string | null;
    receivedByUser: { name: string };
  } | null;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  PAID: "bg-gray-100 text-gray-800",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((res) => res.json())
      .then((data) => setOrder(data.order))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleAction(action: string, extra: Record<string, string> = {}) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder({ ...order, ...data.order });
        setShowRejectForm(false);
        setShowPaymentForm(false);
      } else {
        const { error } = await res.json();
        alert(error || "Action failed");
      }
    } catch {
      alert("Something went wrong");
    }
    setActionLoading(false);
  }

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;
  if (!order) return <div className="p-6 text-gray-400">Order not found.</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/orders")} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
          &larr; Back to Orders
        </button>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Created {new Date(order.createdAt).toLocaleString()} by {order.createdByUser.name}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              statusColors[order.status] || "bg-gray-100"
            }`}
          >
            {order.status}
          </span>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Customer</p>
            <p className="font-medium">{order.customer.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Phone</p>
            <p className="font-medium">{order.customer.phone}</p>
          </div>
          <div>
            <p className="text-gray-500">Area</p>
            <p className="font-medium">{order.customer.area}</p>
          </div>
        </div>

        {order.notes && (
          <div className="mt-3 text-sm">
            <p className="text-gray-500">Notes</p>
            <p>{order.notes}</p>
          </div>
        )}

        {order.rejectionReason && (
          <div className="mt-3 text-sm bg-red-50 p-3 rounded-md">
            <p className="text-red-600 font-medium">Rejection Reason</p>
            <p className="text-red-700">{order.rejectionReason}</p>
            {order.reviewedByUser && (
              <p className="text-red-500 text-xs mt-1">by {order.reviewedByUser.name}</p>
            )}
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg border border-gray-200 mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Unit Price</th>
              <th className="px-4 py-3 font-medium">Quantity</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {order.items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{item.productName}</td>
                <td className="px-4 py-3">{Number(item.unitPrice).toLocaleString()}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3 text-right">{Number(item.totalPrice).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-gray-200">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right font-medium">
                Grand Total
              </td>
              <td className="px-4 py-3 text-right font-semibold">
                {Number(order.totalAmount).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Shipment Info */}
      {order.shipment && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
          <h2 className="font-semibold mb-3">Shipment Details</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Shipped By</p>
              <p className="font-medium">{order.shipment.shippedByUser.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Shipped At</p>
              <p className="font-medium">{new Date(order.shipment.shippedAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Delivered At</p>
              <p className="font-medium">
                {order.shipment.deliveredAt
                  ? new Date(order.shipment.deliveredAt).toLocaleString()
                  : "Pending"}
              </p>
            </div>
          </div>
          {order.shipment.deliveryNotes && (
            <p className="mt-2 text-sm text-gray-600">{order.shipment.deliveryNotes}</p>
          )}
        </div>
      )}

      {/* Payment Info */}
      {order.payment && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
          <h2 className="font-semibold mb-3">Payment Details</h2>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Amount</p>
              <p className="font-medium">{Number(order.payment.amount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Method</p>
              <p className="font-medium">{order.payment.method.replace("_", " ")}</p>
            </div>
            <div>
              <p className="text-gray-500">Received By</p>
              <p className="font-medium">{order.payment.receivedByUser.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Date</p>
              <p className="font-medium">{new Date(order.payment.receivedAt).toLocaleString()}</p>
            </div>
          </div>
          {order.payment.reference && (
            <p className="mt-2 text-sm text-gray-600">Ref: {order.payment.reference}</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {order.status === "PENDING" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex gap-3">
            <button
              onClick={() => handleAction("approve")}
              disabled={actionLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? "Processing..." : "Approve"}
            </button>
            <button
              onClick={() => setShowRejectForm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 cursor-pointer"
            >
              Reject
            </button>
          </div>
          {showRejectForm && (
            <div className="mt-3 space-y-2">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Rejection reason..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                rows={2}
              />
              <button
                onClick={() => handleAction("reject", { rejectionReason })}
                disabled={actionLoading || !rejectionReason}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                Confirm Reject
              </button>
            </div>
          )}
        </div>
      )}

      {order.status === "APPROVED" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <button
            onClick={() => handleAction("ship")}
            disabled={actionLoading}
            className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
          >
            {actionLoading ? "Processing..." : "Mark as Shipped"}
          </button>
        </div>
      )}

      {order.status === "SHIPPED" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <button
            onClick={() => handleAction("deliver")}
            disabled={actionLoading}
            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 cursor-pointer"
          >
            {actionLoading ? "Processing..." : "Mark as Delivered"}
          </button>
        </div>
      )}

      {order.status === "DELIVERED" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {!showPaymentForm ? (
            <button
              onClick={() => setShowPaymentForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 cursor-pointer"
            >
              Record Payment
            </button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount</label>
                  <input
                    value={Number(order.totalAmount).toLocaleString()}
                    disabled
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="MOBILE_BANKING">Mobile Banking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reference</label>
                  <input
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Payment notes..."
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleAction("pay", {
                      paymentMethod,
                      paymentReference,
                      paymentNotes,
                    })
                  }
                  disabled={actionLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? "Processing..." : "Confirm Payment"}
                </button>
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="px-4 py-2 rounded-md text-sm border border-gray-300 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
