import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { formatCurrency, timeAgo } from "@/lib/utils";
import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Orders" };

const statusStyles: Record<string, string> = {
  PENDING: "badge-warning",
  PAID: "badge-info",
  PROCESSING: "badge-info",
  SHIPPED: "badge-info",
  DELIVERED: "badge-success",
  CANCELLED: "badge-error",
  REFUNDED: "badge-neutral",
};

export default async function OrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in?callbackUrl=/orders");

  let orders: any[] = [];
  try {
    orders = await prisma.order.findMany({
      where: { buyerId: session.user.id },
      include: {
        shop: { select: { name: true, slug: true } },
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { position: "asc" }, take: 1 },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {}

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-[Outfit] mb-8">
        My Orders
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            No orders yet
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Start shopping to see your orders here
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-full hover:bg-brand-dark transition-colors"
          >
            Browse Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-5 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-colors animate-fade-in-up"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <p className="text-xs text-gray-400">
                    Order #{order.id.slice(-8).toUpperCase()} • {timeAgo(order.createdAt)}
                  </p>
                  <p className="text-sm text-gray-500">
                    from <span className="font-medium text-gray-700">{order.shop.name}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${statusStyles[order.status] || "badge-neutral"}`}>
                    {order.status}
                  </span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(Number(order.totalAmount))}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {order.items.map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/product/${item.product.id}`}
                    className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-100 hover:ring-2 hover:ring-brand/30 transition-all"
                  >
                    <img
                      src={item.product.images[0]?.url || "/placeholder-product.svg"}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
