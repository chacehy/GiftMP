import { getAdminStats } from "@/actions/admin.actions";
import { Users, Store, Package, ShoppingBag, UserCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Overview" };

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  const cards = [
    { label: "Buyers", value: stats.buyers.toString(), icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Sellers", value: stats.sellers.toString(), icon: UserCheck, color: "bg-green-50 text-green-600" },
    { label: "Shops", value: stats.shops.toString(), icon: Store, color: "bg-purple-50 text-purple-600" },
    { label: "Products", value: stats.products.toString(), icon: Package, color: "bg-orange-50 text-orange-600" },
    { label: "Orders", value: stats.orders.toString(), icon: ShoppingBag, color: "bg-yellow-50 text-yellow-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 font-[Outfit] mb-6">Platform Overview</h1>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
        {cards.map((card) => (
          <div
            key={card.label}
            className="p-5 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-all"
          >
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
