import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Star, Store, ArrowLeft, Clock, Sparkles, Tag } from "lucide-react";
import Link from "next/link";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import { ReviewSection } from "@/components/product/review-section";
import { ProductCard } from "@/components/product/product-card";
import type { Metadata } from "next";

const TYPE_LABELS: Record<string, string> = {
  HANDMADE: "Handmade",
  VINTAGE: "Vintage",
  SUPPLY: "Craft Supply",
};

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
        shop: { select: { id: true, userId: true, name: true, slug: true, logoUrl: true } },
        category: { select: { name: true, slug: true } },
        variant: { include: { options: { orderBy: { priceDelta: "asc" } } } },
        reviews: {
          include: { user: { select: { name: true, image: true } }, images: true },
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

  let moreFromShop: any[] = [];
  try {
    moreFromShop = await prisma.product.findMany({
      where: { shopId: product.shop.id, isPublished: true, id: { not: product.id } },
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        shop: { select: { name: true, slug: true } },
        reviews: { select: { rating: true } },
      },
      take: 4,
      orderBy: { createdAt: "desc" },
    });
  } catch {}

  const variant = product.variant
    ? {
        id: product.variant.id,
        name: product.variant.name,
        options: product.variant.options.map((o: any) => ({
          id: o.id,
          label: o.label,
          priceDelta: Number(o.priceDelta),
          stock: o.stock,
        })),
      }
    : null;

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
        <ProductGallery images={product.images} title={product.title} />

        {/* ─── Product Info ─── */}
        <div className="animate-fade-in-up">
          {/* Shop link */}
          <Link
            href={`/shop/${product.shop.slug}`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand transition-colors mb-3"
          >
            {product.shop.logoUrl ? (
              <img src={product.shop.logoUrl} alt={product.shop.name} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-brand-cream flex items-center justify-center text-xs font-semibold text-brand">
                {product.shop.name.charAt(0)}
              </div>
            )}
            {product.shop.name}
          </Link>

          <div className="flex items-center gap-2 mb-3">
            <span className="badge badge-neutral text-[10px]">{TYPE_LABELS[product.type] || product.type}</span>
          </div>

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

          <ProductPurchasePanel
            productId={product.id}
            basePrice={Number(product.price)}
            stock={product.stock}
            variant={variant}
          />

          {/* Description */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
            <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {product.description}
            </div>
          </div>

          {/* Details: materials, processing time, personalization */}
          {(product.materials.length > 0 || product.processingTime || product.personalization) && (
            <div className="mt-6 space-y-3">
              {product.materials.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <p>
                    <span className="text-gray-500">Materials: </span>
                    <span className="text-gray-800">{product.materials.join(", ")}</span>
                  </p>
                </div>
              )}
              {product.processingTime && (
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <p>
                    <span className="text-gray-500">Processing time: </span>
                    <span className="text-gray-800">{product.processingTime}</span>
                  </p>
                </div>
              )}
              {product.personalization && (
                <div className="p-3 rounded-xl bg-brand-cream/40 border border-brand/10 text-sm text-gray-700">
                  <span className="font-medium">Personalization: </span>
                  {product.personalization}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/products?q=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs hover:bg-brand-cream hover:text-brand-dark transition-colors"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Shop Card */}
          <div className="mt-8 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <Link href={`/shop/${product.shop.slug}`} className="flex items-center gap-3 group">
              {product.shop.logoUrl ? (
                <img
                  src={product.shop.logoUrl}
                  alt={product.shop.name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-brand-cream flex items-center justify-center text-lg font-bold text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                  {product.shop.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-brand transition-colors">
                  {product.shop.name}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Store className="w-3 h-3" /> Visit shop →
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── More from this shop ─── */}
      {moreFromShop.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold text-gray-900 font-[Outfit] mb-5">More from {product.shop.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {moreFromShop.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* ─── Reviews ─── */}
      <ReviewSection
        productId={product.id}
        shopOwnerId={product.shop.userId}
        reviews={product.reviews}
        avgRating={avgRating}
      />
    </div>
  );
}
