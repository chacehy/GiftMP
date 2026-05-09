import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Star, ShoppingCart, Store, ArrowLeft, Minus, Plus, Package } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { ReviewSection } from "@/components/product/review-section";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { title: true, description: true },
    });
    if (!product) return { title: "Product Not Found" };
    return {
      title: product.title,
      description: product.description.slice(0, 160),
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let product: any = null;
  try {
    product = await prisma.product.findUnique({
      where: { id, isPublished: true },
      include: {
        images: { orderBy: { position: "asc" } },
        shop: { select: { id: true, name: true, slug: true, logoUrl: true } },
        category: { select: { name: true, slug: true } },
        reviews: {
          include: { user: { select: { name: true, image: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } catch {
    // DB not available
  }

  if (!product) notFound();

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / product.reviews.length
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/products" className="hover:text-brand transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Products
        </Link>
        <span>/</span>
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-brand transition-colors">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900 truncate max-w-[200px]">{product.title}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* ─── Image Gallery ─── */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
            <img
              src={product.images[0]?.url || "/placeholder-product.svg"}
              alt={product.images[0]?.altText || product.title}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.slice(1, 5).map((img: any) => (
                <div
                  key={img.id}
                  className="aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-transparent hover:border-brand/50 transition-colors cursor-pointer"
                >
                  <img
                    src={img.url}
                    alt={img.altText || product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Product Info ─── */}
        <div className="animate-fade-in-up">
          {/* Shop link */}
          <Link
            href={`/shop/${product.shop.slug}`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand transition-colors mb-3"
          >
            <div className="w-6 h-6 rounded-full bg-brand-cream flex items-center justify-center text-xs font-semibold text-brand">
              {product.shop.name.charAt(0)}
            </div>
            {product.shop.name}
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-[Outfit] leading-tight mb-3">
            {product.title}
          </h1>

          {/* Rating */}
          {avgRating > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(avgRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-400">
                ({product.reviews.length} review{product.reviews.length !== 1 ? "s" : ""})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mb-6">
            <span className="text-3xl font-bold text-gray-900">
              {formatCurrency(Number(product.price))}
            </span>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-4 h-4 text-gray-400" />
            {product.stock > 0 ? (
              <span className="text-sm">
                <span className="font-medium text-green-600">In stock</span>
                <span className="text-gray-400"> — {product.stock} available</span>
              </span>
            ) : (
              <span className="text-sm font-medium text-red-500">Out of stock</span>
            )}
          </div>

          {/* Add to Cart */}
          <AddToCartButton productId={product.id} stock={product.stock} />

          {/* Description */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
            <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {product.description}
            </div>
          </div>

          {/* Shop Card */}
          <div className="mt-8 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <Link href={`/shop/${product.shop.slug}`} className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-xl bg-brand-cream flex items-center justify-center text-lg font-bold text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                {product.shop.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-brand transition-colors">
                  {product.shop.name}
                </p>
                <p className="text-xs text-gray-500">Visit shop →</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Reviews ─── */}
      <ReviewSection
        productId={product.id}
        reviews={product.reviews}
        avgRating={avgRating}
      />
    </div>
  );
}
