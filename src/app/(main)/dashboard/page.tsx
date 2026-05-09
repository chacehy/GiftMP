import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Package, ShoppingBag, Star } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Seller Dashboard" };

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  let stats = { revenue: 0, orders: 0, products: 0, avgRating: 0 };

  try {
    const shop = await prisma.shop.findUnique({
      where: { userId: session.user.id },
    });
    if (shop) {
      const [orders, productCount, reviews] = await Promise.all([
        prisma.order.findMany({
          where: { shopId: shop.id, status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
          select: { totalAmount: true },
        }),
        prisma.product.count({ where: { shopId: shop.id } }),
        prisma.review.findMany({
          where: { product: { shopId: shop.id } },
          select: { rating: true },
        }),
      ]);

      stats.revenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      stats.orders = orders.length;
      stats.products = productCount;
      stats.avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
    }
  } catch {}

  const cards = [
    { label: "Revenue", value: formatCurrency(stats.revenue), icon: DollarSign, color: "bg-green-50 text-green-600" },
    { label: "Orders", value: stats.orders.toString(), icon: ShoppingBag, color: "bg-blue-50 text-blue-600" },
    { label: "Products", value: stats.products.toString(), icon: Package, color: "bg-purple-50 text-purple-600" },
    { label: "Avg Rating", value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—", icon: Star, color: "bg-yellow-50 text-yellow-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 font-[Outfit] mb-6">Overview</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
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
