import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { MapPin } from "lucide-react";
import { OrderStatusUpdater } from "@/components/dashboard/order-status-updater";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manage Orders" };

export default async function DashboardOrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  let orders: any[] = [];
  try {
    const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
    if (shop) {
      orders = await prisma.order.findMany({
        where: { shopId: shop.id },
        include: {
          buyer: { select: { name: true, email: true } },
          items: {
            include: { product: { select: { title: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }
  } catch {}

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 font-[Outfit] mb-6">Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-500">No orders yet. They will appear here once buyers purchase your products.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-5 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">
                    Order #{order.id.slice(-8).toUpperCase()} • {timeAgo(order.createdAt)}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{order.buyer.name}</span>
                    <span className="text-gray-400"> — {order.buyer.email}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {order.shippingAddress}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-lg">{formatCurrency(Number(order.totalAmount))}</p>
                  <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-50 space-y-1">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product.title} × {item.quantity}
                    </span>
                    <span className="text-gray-500">{formatCurrency(Number(item.price) * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
