"use client";

import { useEffect, useState } from "react";
import { taka } from "@/lib/format";

interface Damage {
  productId: string;
  quantity: number;
  product: { name: string; sku: string | null; sellingPrice: string };
}

interface ProductDamage {
  productId: string;
  productName: string;
  sku: string | null;
  totalDamaged: number;
  totalLoss: number;
}

export default function DamageStockPage() {
  const [damages, setDamages] = useState<ProductDamage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/damages")
      .then((res) => res.json())
      .then((data) => {
        const records: Damage[] = data.damages || [];
        const map = new Map<string, ProductDamage>();
        for (const d of records) {
          const existing = map.get(d.productId);
          const loss = Number(d.product.sellingPrice) * d.quantity;
          if (existing) {
            existing.totalDamaged += d.quantity;
            existing.totalLoss += loss;
          } else {
            map.set(d.productId, {
              productId: d.productId,
              productName: d.product.name,
              sku: d.product.sku,
              totalDamaged: d.quantity,
              totalLoss: loss,
            });
          }
        }
        setDamages(
          Array.from(map.values()).sort((a, b) => b.totalLoss - a.totalLoss)
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grandTotal = damages.reduce((sum, d) => sum + d.totalLoss, 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Damage Stock</h1>

      {damages.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">
            Total damage loss: <span className="font-bold">{taka(grandTotal)}</span>
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
                <th className="px-4 py-3 font-medium">Total Damaged</th>
                <th className="px-4 py-3 font-medium">Total Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : damages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No damaged stock found.
                  </td>
                </tr>
              ) : (
                damages.map((d) => (
                  <tr key={d.productId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{d.productName}</td>
                    <td className="px-4 py-3 text-gray-500">{d.sku || "-"}</td>
                    <td className="px-4 py-3 text-red-600 font-medium">{d.totalDamaged}</td>
                    <td className="px-4 py-3 text-red-600">{taka(d.totalLoss)}</td>
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
