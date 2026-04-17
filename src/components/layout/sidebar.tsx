import Link from "next/link";

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
  return (
    <aside className="w-64 border-r border-gray-200 bg-white min-h-screen p-4">
      <h1 className="text-xl font-bold mb-6">DLMS</h1>
      <nav className="flex flex-col gap-1">
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
    </aside>
  );
}
