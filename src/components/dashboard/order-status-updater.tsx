"use client";

import { useState } from "react";
import { updateOrderStatus } from "@/actions/order.actions";
import { useRouter } from "next/navigation";

const statusOptions = [
  "PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED",
] as const;

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  PAID: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SHIPPED: "bg-cyan-50 text-cyan-700 border-cyan-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-gray-50 text-gray-600 border-gray-200",
};

export function OrderStatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as any;
    if (newStatus === currentStatus) return;
    setLoading(true);
    await updateOrderStatus({ orderId, status: newStatus });
    router.refresh();
    setLoading(false);
  };

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      disabled={loading}
      className={`mt-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border appearance-none cursor-pointer transition-colors ${
        statusColors[currentStatus] || "bg-gray-50 text-gray-600 border-gray-200"
      } disabled:opacity-50`}
    >
      {statusOptions.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
