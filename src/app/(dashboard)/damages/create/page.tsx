"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  stock: number;
  trackInventory: boolean;
  unit: string;
}

export default function CreateDamagePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {});
  }, []);

  const selected = products.find((p) => p.id === selectedProduct);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct || !quantity || Number(quantity) <= 0 || !reason) {
      alert("Product, quantity, and reason are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/damages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct,
          quantity: Number(quantity),
          reason,
          notes,
        }),
      });
      if (res.ok) {
        router.push("/damages");
      } else {
        const err = await res.json();
        alert(err.detail || err.error || "Failed to report damage");
      }
    } catch {
      alert("Failed to report damage");
    }
    setSubmitting(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Report Damage</h1>
      <form
        onSubmit={handleSubmit}
        className="max-w-lg space-y-4 bg-white p-6 rounded-lg border border-gray-200"
      >
        <div>
          <label className="block text-sm font-medium mb-1">
            Product <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Select a product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Stock: {p.trackInventory ? p.stock : "N/A"})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            max={selected?.trackInventory ? selected.stock : undefined}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          {selected?.trackInventory && (
            <p className="text-xs text-gray-500 mt-1">
              Available stock: {selected.stock} {selected.unit}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Reason <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Select reason</option>
            <option value="Expired">Expired</option>
            <option value="Broken">Broken</option>
            <option value="Defective">Defective</option>
            <option value="Lost">Lost</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Reporting..." : "Report Damage"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/damages")}
            className="px-4 py-2 rounded-md text-sm border border-gray-300 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
