"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { taka } from "@/lib/format";

interface LineItem {
  productId: string;
  quantity: number;
}

interface OrderForm {
  customerId: string;
  notes: string;
  items: LineItem[];
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Product {
  id: string;
  name: string;
  sellingPrice: string;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const [productSearches, setProductSearches] = useState<Record<number, string>>({});
  const [showProductDropdowns, setShowProductDropdowns] = useState<Record<number, boolean>>({});
  const productDropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    fetch("/api/customers?limit=50")
      .then((res) => res.json())
      .then((data) => setCustomers(data.customers || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrderForm>({
    defaultValues: { items: [{ productId: "", quantity: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");

  function getLineTotal(index: number): number {
    const item = items[index];
    if (!item?.productId) return 0;
    const product = products.find((p) => p.id === item.productId);
    return product ? Number(product.sellingPrice) * (item.quantity || 0) : 0;
  }

  const grandTotal = items.reduce((sum, _, i) => sum + getLineTotal(i), 0);

  async function onSubmit(data: OrderForm) {
    if (!data.customerId) {
      alert("Please select a customer");
      return;
    }
    const hasEmptyProduct = data.items.some((item) => !item.productId);
    if (hasEmptyProduct) {
      alert("Please select a product for all line items");
      return;
    }
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push("/orders");
    } else {
      const err = await res.json();
      alert(err.detail || err.error || "Failed to create order");
    }
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );

  function getFilteredProducts(index: number) {
    const search = productSearches[index] || "";
    const selectedIds = items
      .map((item, i) => (i !== index ? item.productId : null))
      .filter(Boolean);
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) &&
        !selectedIds.includes(p.id)
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Create Order</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-3xl space-y-4 bg-white p-6 rounded-lg border border-gray-200"
      >
        {/* Customer Select */}
        <div className="relative" ref={customerDropdownRef}>
          <label className="block text-sm font-medium mb-1">
            Customer <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Search customer by name or phone..."
            value={selectedCustomer ? `${selectedCustomer.name} - ${selectedCustomer.phone}` : customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setSelectedCustomer(null);
              setValue("customerId", "");
              setShowCustomerDropdown(true);
            }}
            onFocus={() => setShowCustomerDropdown(true)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <input type="hidden" {...register("customerId", { required: "Customer is required" })} />
          {errors.customerId && (
            <p className="text-red-500 text-xs mt-1">{errors.customerId.message}</p>
          )}
          {showCustomerDropdown && !selectedCustomer && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <p className="px-3 py-2 text-sm text-gray-400">No customers found</p>
              ) : (
                filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(c);
                      setValue("customerId", c.id);
                      setShowCustomerDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                  >
                    {c.name} - {c.phone}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Line Items */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Order Items <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search product..."
                    value={
                      items[index]?.productId
                        ? products.find((p) => p.id === items[index].productId)?.name || ""
                        : productSearches[index] || ""
                    }
                    onChange={(e) => {
                      setProductSearches((prev) => ({ ...prev, [index]: e.target.value }));
                      setShowProductDropdowns((prev) => ({ ...prev, [index]: true }));
                    }}
                    onFocus={() => setShowProductDropdowns((prev) => ({ ...prev, [index]: true }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                  {showProductDropdowns[index] && !items[index]?.productId && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {getFilteredProducts(index).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setValue(`items.${index}.productId`, p.id);
                            setProductSearches((prev) => ({ ...prev, [index]: "" }));
                            setShowProductDropdowns((prev) => ({ ...prev, [index]: false }));
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex justify-between"
                        >
                          <span>{p.name}</span>
                          <span className="text-gray-500">{taka(Number(p.sellingPrice))}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  min={1}
                  {...register(`items.${index}.quantity`, { valueAsNumber: true, min: 1 })}
                  className="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
                <span className="px-3 py-2 text-sm text-gray-600 min-w-[80px] text-right">
                  {taka(getLineTotal(index))}
                </span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="px-2 py-2 text-red-500 hover:text-red-700 text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => append({ productId: "", quantity: 1 })}
            className="mt-2 text-sm text-blue-600 hover:underline cursor-pointer"
          >
            + Add Item
          </button>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            {...register("notes")}
            rows={2}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        {/* Total & Submit */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="text-lg font-semibold">
            Total: {taka(grandTotal)}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Creating..." : "Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
