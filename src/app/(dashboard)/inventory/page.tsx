"use client";

import { useEffect, useState, useRef } from "react";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  trackInventory: boolean;
  stock: number;
  minimumStockLevel: number | null;
  unit: string;
}

interface StockIn {
  id: string;
  quantity: number;
  notes: string | null;
  createdAt: string;
  product: { name: string; sku: string | null };
  createdByUser: { name: string };
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<StockIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"stock" | "history">("stock");

  // Stock in form state
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const productSearchRef = useRef("");

  function fetchData() {
    setLoading(true);
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/stock-in").then((r) => r.json()),
    ])
      .then(([pData, hData]) => {
        setProducts((pData.products || []).filter((p: Product) => p.trackInventory));
        setHistory(hData.stockIns || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleStockIn(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct || !quantity || Number(quantity) <= 0) {
      alert("Please select a product and enter quantity");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/stock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct,
          quantity: Number(quantity),
          notes,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setSelectedProduct("");
        setQuantity("");
        setNotes("");
        fetchData();
      } else {
        const err = await res.json();
        alert(err.detail || err.error || "Failed to add stock");
      }
    } catch {
      alert("Failed to add stock");
    }
    setSubmitting(false);
  }

  const lowStockProducts = products.filter(
    (p) => p.minimumStockLevel != null && p.stock <= p.minimumStockLevel
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 cursor-pointer"
        >
          Stock In
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-700 mb-2">
            Low Stock Alert ({lowStockProducts.length} products)
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.map((p) => (
              <span
                key={p.id}
                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
              >
                {p.name}: {p.stock} / {p.minimumStockLevel} {p.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setTab("stock")}
          className={`px-4 py-2 rounded-md text-sm cursor-pointer ${
            tab === "stock"
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Current Stock
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-4 py-2 rounded-md text-sm cursor-pointer ${
            tab === "history"
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Stock In History
        </button>
      </div>

      {/* Stock In Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            onSubmit={handleStockIn}
            className="bg-white rounded-lg p-6 w-full max-w-md space-y-4"
          >
            <h2 className="text-lg font-semibold">Stock In</h2>

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
                    {p.name} (Current: {p.stock})
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
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-md text-sm border border-gray-300 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Adding..." : "Add Stock"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Current Stock Table */}
      {tab === "stock" && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Current Stock</th>
                  <th className="px-4 py-3 font-medium">Min Level</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
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
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No tracked products. Enable "Track Inventory" on a product first.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isLow =
                      p.minimumStockLevel != null &&
                      p.stock <= p.minimumStockLevel;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {p.sku || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={isLow ? "text-red-600 font-medium" : ""}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3">{p.minimumStockLevel ?? "-"}</td>
                        <td className="px-4 py-3">{p.unit}</td>
                        <td className="px-4 py-3">
                          {isLow ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              In Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock In History */}
      {tab === "history" && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Quantity</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                  <th className="px-4 py-3 font-medium">Added By</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      No stock in history yet.
                    </td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {h.product.name}
                      </td>
                      <td className="px-4 py-3 text-green-600 font-medium">
                        +{h.quantity}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {h.notes || "-"}
                      </td>
                      <td className="px-4 py-3">{h.createdByUser.name}</td>
                      <td className="px-4 py-3">
                        {new Date(h.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
