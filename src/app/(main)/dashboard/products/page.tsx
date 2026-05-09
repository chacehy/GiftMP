import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { formatCurrency, timeAgo } from "@/lib/utils";
import Link from "next/link";
import { Plus, Edit, Eye, EyeOff } from "lucide-react";
import { DeleteProductButton } from "@/components/dashboard/delete-product-button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manage Products" };

export default async function DashboardProductsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  let products: any[] = [];
  try {
    const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
    if (shop) {
      products = await prisma.product.findMany({
        where: { shopId: shop.id },
        include: {
          images: { orderBy: { position: "asc" }, take: 1 },
          category: { select: { name: true } },
          _count: { select: { reviews: true, orderItems: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }
  } catch {}

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-[Outfit]">Products</h1>
        <Link
          href="/dashboard/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-500 mb-4">You haven&apos;t added any products yet</p>
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <img
                  src={product.images[0]?.url || "/placeholder-product.svg"}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{product.title}</h3>
                  {product.isPublished ? (
                    <span className="badge badge-success text-[10px]">
                      <Eye className="w-3 h-3 mr-0.5" /> Live
                    </span>
                  ) : (
                    <span className="badge badge-neutral text-[10px]">
                      <EyeOff className="w-3 h-3 mr-0.5" /> Draft
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{product.category.name}</span>
                  <span>Stock: {product.stock}</span>
                  <span>{product._count.orderItems} sold</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-900">{formatCurrency(Number(product.price))}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/dashboard/products/${product.id}/edit`}
                  className="p-2 rounded-lg text-gray-400 hover:text-brand hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <DeleteProductButton productId={product.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
