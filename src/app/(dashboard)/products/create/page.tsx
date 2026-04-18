"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProductForm {
  name: string;
  sku: string;
  description: string;
  categoryId: string;
  brand: string;
  tags: string;
  actualPrice: string;
  sellingPrice: string;
  trackInventory: boolean;
  minimumStockLevel: string;
  unit: "PCS" | "KG" | "LITER";
}

interface Category {
  id: string;
  name: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    defaultValues: {
      unit: "PCS",
      trackInventory: false,
    },
  });

  const trackInventory = watch("trackInventory");

  async function onSubmit(data: ProductForm) {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/products");
    } else {
      const { error } = await res.json();
      alert(error || "Failed to create product");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Create Product</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-lg space-y-4 bg-white p-6 rounded-lg border border-gray-200"
      >
        <div>
          <label className="block text-sm font-medium mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register("name", { required: "Product name is required" })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">SKU</label>
          <input
            {...register("sku")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            {...register("description")}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            {...register("categoryId")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Brand</label>
          <input
            {...register("brand")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          <input
            {...register("tags")}
            placeholder="e.g. electronics, sale"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Actual Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register("actualPrice", {
                required: "Actual price is required",
              })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            {errors.actualPrice && (
              <p className="text-red-500 text-xs mt-1">
                {errors.actualPrice.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Selling Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register("sellingPrice", {
                required: "Selling price is required",
              })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            {errors.sellingPrice && (
              <p className="text-red-500 text-xs mt-1">
                {errors.sellingPrice.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Unit</label>
          <select
            {...register("unit")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="PCS">Pcs</option>
            <option value="KG">Kg</option>
            <option value="LITER">Liter</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={trackInventory}
            onClick={() => setValue("trackInventory", !trackInventory)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              trackInventory ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                trackInventory ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <label className="text-sm font-medium">Track Inventory</label>
        </div>

        {trackInventory && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Minimum Stock Level
            </label>
            <input
              type="number"
              {...register("minimumStockLevel")}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? "Creating..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}
