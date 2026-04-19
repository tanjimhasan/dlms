"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Dashboard", href: "/" },
];

const productSubItems = [
  { label: "Product List", href: "/products" },
  { label: "Create Product", href: "/products/create" },
];

const orderSubItems = [
  { label: "Order List", href: "/orders" },
  { label: "Pending Approvals", href: "/orders/pending" },
  { label: "Shipments", href: "/orders/shipments" },
  { label: "Payments", href: "/orders/payments" },
];

const damageSubItems = [
  { label: "Damage List", href: "/damages" },
  { label: "Create Damage", href: "/damages/create" },
  { label: "Damage Stock", href: "/damages/stock" },
];

const customerSubItems = [
  { label: "Customer List", href: "/customers/list" },
  { label: "Create Customer", href: "/customers/create" },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [productsOpen, setProductsOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [damagesOpen, setDamagesOpen] = useState(false);
  const [customersOpen, setCustomersOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/products")) setProductsOpen(true);
    if (pathname.startsWith("/orders")) setOrdersOpen(true);
    if (pathname.startsWith("/damages")) setDamagesOpen(true);
    if (pathname.startsWith("/customers")) setCustomersOpen(true);
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  function linkClass(href: string) {
    return `px-3 py-2 rounded-md text-sm ${
      isActive(href)
        ? "bg-blue-50 text-blue-700 font-medium"
        : "hover:bg-gray-100"
    }`;
  }

  function sectionClass(href: string) {
    return `px-3 py-2 rounded-md text-sm text-left cursor-pointer flex items-center justify-between ${
      isActive(href) ? "bg-blue-50 font-medium" : "hover:bg-gray-100"
    }`;
  }

  function subItems(items: { label: string; href: string }[]) {
    return items.map((item) => (
      <Link key={item.href} href={item.href} className={linkClass(item.href)}>
        {item.label}
      </Link>
    ));
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="w-64 border-r border-gray-200 bg-white min-h-screen p-4 flex flex-col">
      <h1 className="text-xl font-bold mb-6">DLMS</h1>
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={linkClass(item.href)}>
            {item.label}
          </Link>
        ))}

        {/* Products */}
        <button
          onClick={() => setProductsOpen(!productsOpen)}
          className={sectionClass("/products")}
        >
          Products
          <span className="text-xs">{productsOpen ? "▲" : "▼"}</span>
        </button>
        {productsOpen && (
          <div className="ml-3 flex flex-col gap-1 border-l border-gray-200 pl-3">
            {subItems(productSubItems)}
          </div>
        )}

        {/* Inventory */}
        <Link href="/inventory" className={linkClass("/inventory")}>
          Inventory
        </Link>

        {/* Orders */}
        <button
          onClick={() => setOrdersOpen(!ordersOpen)}
          className={sectionClass("/orders")}
        >
          Orders
          <span className="text-xs">{ordersOpen ? "▲" : "▼"}</span>
        </button>
        {ordersOpen && (
          <div className="ml-3 flex flex-col gap-1 border-l border-gray-200 pl-3">
            {subItems(orderSubItems)}
          </div>
        )}

        {/* Damage */}
        <button
          onClick={() => setDamagesOpen(!damagesOpen)}
          className={sectionClass("/damages")}
        >
          Damage
          <span className="text-xs">{damagesOpen ? "▲" : "▼"}</span>
        </button>
        {damagesOpen && (
          <div className="ml-3 flex flex-col gap-1 border-l border-gray-200 pl-3">
            {subItems(damageSubItems)}
          </div>
        )}

        {/* Customers */}
        <button
          onClick={() => setCustomersOpen(!customersOpen)}
          className={sectionClass("/customers")}
        >
          Customers
          <span className="text-xs">{customersOpen ? "▲" : "▼"}</span>
        </button>
        {customersOpen && (
          <div className="ml-3 flex flex-col gap-1 border-l border-gray-200 pl-3">
            {subItems(customerSubItems)}
          </div>
        )}

        <Link href="/reports" className={linkClass("/reports")}>
          Reports
        </Link>
        <Link href="/settings" className={linkClass("/settings")}>
          Settings
        </Link>
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
