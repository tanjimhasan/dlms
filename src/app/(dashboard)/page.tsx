"use client";

import { useEffect, useState } from "react";
import { taka } from "@/lib/format";

interface DashboardData {
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  balance: {
    cash: number;
    bank: number;
    mobile: number;
    total: number;
  };
  stock: {
    availableStock: number;
    purchasedStock: number;
    saleStock: number;
    damageStock: number;
  };
  totalCustomerDue: number;
  totalDue: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-400">Loading...</div>;
  }

  const balanceCards = [
    { label: "Cash Balance", value: data?.balance?.cash ?? 0, color: "bg-green-50 text-green-700" },
    { label: "Bank Balance", value: data?.balance?.bank ?? 0, color: "bg-blue-50 text-blue-700" },
    { label: "Mobile Banking", value: data?.balance?.mobile ?? 0, color: "bg-purple-50 text-purple-700" },
    { label: "Total Balance", value: data?.balance?.total ?? 0, color: "bg-amber-50 text-amber-700" },
  ];

  const summaryCards = [
    { label: "Active Customers", value: data?.totalCustomers ?? 0 },
    { label: "Total Products", value: data?.totalProducts ?? 0 },
    { label: "Pending Orders", value: data?.pendingOrders ?? 0 },
  ];

  const dueCards = [
    { label: "Customer Due", value: data?.totalCustomerDue ?? 0 },
    { label: "Total Due", value: data?.totalDue ?? 0 },
  ];

  const stockCards = [
    { label: "Available Stock", value: data?.stock?.availableStock ?? 0 },
    { label: "Sale Stock", value: data?.stock?.saleStock ?? 0 },
    { label: "Damage Stock", value: data?.stock?.damageStock ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {balanceCards.map((card) => (
          <div
            key={card.label}
            className={`${card.color} rounded-lg border border-gray-200 p-5`}
          >
            <p className="text-sm font-medium opacity-80">{card.label}</p>
            <p className="text-2xl font-bold mt-1">
              {taka(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-gray-200 p-5"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Stock Value Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stockCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-gray-200 p-5"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{taka(card.value)}</p>
          </div>
        ))}
      </div>

      {/* Due Cards */}
      <div className="grid grid-cols-2 gap-4">
        {dueCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-gray-200 p-5"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{taka(card.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
