"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { taka } from "@/lib/format";

interface Damage {
  id: string;
  quantity: number;
  reason: string;
  notes: string | null;
  createdAt: string;
  product: { name: string; sku: string | null; sellingPrice: string };
  createdByUser: { name: string };
}

export default function DamageListPage() {
  const [damages, setDamages] = useState<Damage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/damages")
      .then((res) => res.json())
      .then((data) => setDamages(data.damages || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalLoss = damages.reduce(
    (sum, d) => sum + Number(d.product.sellingPrice) * d.quantity,
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Damage List</h1>
        <Link
          href="/damages/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          Report Damage
        </Link>
      </div>

      {damages.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">
            Total estimated loss: <span className="font-bold">{taka(totalLoss)}</span>
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium">Loss</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium">Reported By</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : damages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    No damage records found.
                  </td>
                </tr>
              ) : (
                damages.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{d.product.name}</td>
                    <td className="px-4 py-3 text-gray-500">{d.product.sku || "-"}</td>
                    <td className="px-4 py-3 text-red-600 font-medium">-{d.quantity}</td>
                    <td className="px-4 py-3 text-red-600">
                      {taka(Number(d.product.sellingPrice) * d.quantity)}
                    </td>
                    <td className="px-4 py-3">{d.reason}</td>
                    <td className="px-4 py-3 text-gray-500">{d.notes || "-"}</td>
                    <td className="px-4 py-3">{d.createdByUser.name}</td>
                    <td className="px-4 py-3">
                      {new Date(d.createdAt).toLocaleDateString()}
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
