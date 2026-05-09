import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { CartActions } from "@/components/cart/cart-actions";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shopping Cart" };

export default async function CartPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in?callbackUrl=/cart");

  let cart: any = null;
  try {
    cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { position: "asc" }, take: 1 },
                shop: { select: { name: true } },
              },
            },
          },
        },
      },
    });
  } catch {}

  const items = cart?.items || [];
  const subtotal = items.reduce(
    (sum: number, item: any) => sum + Number(item.product.price) * item.quantity,
    0
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-[Outfit] mb-8">
        Shopping Cart
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-7 h-7 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Your cart is empty
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Discover amazing handmade products
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-full hover:bg-brand-dark transition-colors"
          >
            Browse Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item: any) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <Link href={`/product/${item.product.id}`} className="shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={item.product.images[0]?.url || "/placeholder-product.svg"}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">
                    {item.product.shop.name}
                  </p>
                  <Link
                    href={`/product/${item.product.id}`}
                    className="text-sm font-medium text-gray-900 hover:text-brand transition-colors line-clamp-1"
                  >
                    {item.product.title}
                  </Link>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {formatCurrency(Number(item.product.price))}
                  </p>
                  <CartActions
                    cartItemId={item.id}
                    quantity={item.quantity}
                    stock={item.product.stock}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})
                  </span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-green-600 font-medium">
                    {subtotal >= 5000 ? "Free" : formatCurrency(500)}
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 flex justify-between font-bold text-lg mb-6">
                <span>Total</span>
                <span>
                  {formatCurrency(subtotal + (subtotal >= 5000 ? 0 : 500))}
                </span>
              </div>
              <Link
                href="/checkout"
                className="w-full flex items-center justify-center gap-2 h-12 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-all hover:shadow-lg hover:shadow-brand/25 active:scale-[0.98]"
              >
                Checkout
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
