"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Orders", href: "/orders" },
  { label: "Inventory", href: "/inventory" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

const productSubItems = [
  { label: "Product List", href: "/products" },
  { label: "Create Product", href: "/products/create" },
];

const customerSubItems = [
  { label: "Customer List", href: "/customers/list" },
  { label: "Create Customer", href: "/customers/create" },
];

export default function Sidebar() {
  const router = useRouter();
  const [customersOpen, setCustomersOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="w-64 border-r border-gray-200 bg-white min-h-screen p-4 flex flex-col">
      <h1 className="text-xl font-bold mb-6">DLMS</h1>
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
          >
            {item.label}
          </Link>
        ))}
        <button
          onClick={() => setProductsOpen(!productsOpen)}
          className="px-3 py-2 rounded-md hover:bg-gray-100 text-sm text-left cursor-pointer flex items-center justify-between"
        >
          Products
          <span className="text-xs">{productsOpen ? "▲" : "▼"}</span>
        </button>
        {productsOpen && (
          <div className="ml-3 flex flex-col gap-1 border-l border-gray-200 pl-3">
            {productSubItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
        <button
          onClick={() => setCustomersOpen(!customersOpen)}
          className="px-3 py-2 rounded-md hover:bg-gray-100 text-sm text-left cursor-pointer flex items-center justify-between"
        >
          Customers
          <span className="text-xs">{customersOpen ? "▲" : "▼"}</span>
        </button>
        {customersOpen && (
          <div className="ml-3 flex flex-col gap-1 border-l border-gray-200 pl-3">
            {customerSubItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
      <button
        onClick={handleLogout}
        className="px-3 py-2 rounded-md hover:bg-gray-100 text-sm text-left text-red-600 cursor-pointer"
      >
        Logout
      </button>
    </aside>
  );
}
