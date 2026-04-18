"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Dealers", href: "/dealers" },
  { label: "Products", href: "/products" },
  { label: "Orders", href: "/orders" },
  { label: "Inventory", href: "/inventory" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const router = useRouter();

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
