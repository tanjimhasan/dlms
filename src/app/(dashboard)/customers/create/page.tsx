"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

interface CustomerForm {
  name: string;
  phone: string;
  area: string;
  status: "ACTIVE" | "INACTIVE";
  totalDue: string;
}

export default function CreateCustomerPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerForm>({
    defaultValues: { status: "ACTIVE", totalDue: "0" },
  });

  async function onSubmit(data: CustomerForm) {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/customers/list");
    } else {
      const { error } = await res.json();
      alert(error || "Failed to create customer");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Create Customer</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-lg space-y-4 bg-white p-6 rounded-lg border border-gray-200"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Customer Name</label>
          <input
            {...register("name", { required: "Customer name is required" })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone Number</label>
          <input
            {...register("phone", { required: "Phone number is required" })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Area</label>
          <input
            {...register("area", { required: "Area is required" })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          {errors.area && (
            <p className="text-red-500 text-xs mt-1">{errors.area.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            {...register("status")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Total Due</label>
          <input
            type="number"
            step="0.01"
            {...register("totalDue")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? "Creating..." : "Create Customer"}
        </button>
      </form>
    </div>
  );
}
