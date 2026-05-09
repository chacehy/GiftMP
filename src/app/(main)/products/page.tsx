import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product/product-card";
import { SortSelect } from "@/components/product/sort-select";
import { Search } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Products",
  description: "Discover unique handmade gifts and vintage items from talented Algerian artisans.",
};

const categoryMap: Record<string, string> = {
  "jewelry-accessories": "Jewelry & Accessories",
  "clothing-shoes": "Clothing & Shoes",
  "home-living": "Home & Living",
  "art-collectibles": "Art & Collectibles",
  "craft-supplies": "Craft Supplies",
  "gifts": "Gifts & Gift Cards",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const categorySlug = params.category || "";
  const sort = params.sort || "newest";

  // Build where clause
  const where: any = { isPublished: true };

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  // Build orderBy
  let orderBy: any = { createdAt: "desc" };
  if (sort === "price-low") orderBy = { price: "asc" };
  if (sort === "price-high") orderBy = { price: "desc" };

  let products: any[] = [];
  let categories: any[] = [];

  try {
    [products, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { position: "asc" }, take: 1 },
          shop: { select: { name: true, slug: true } },
          reviews: { select: { rating: true } },
        },
        orderBy,
        take: 40,
      }),
      prisma.category.findMany({
        orderBy: { name: "asc" },
      }),
    ]);
  } catch {
    // DB not connected
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-[Outfit]">
          {categorySlug
            ? categoryMap[categorySlug] || "Products"
            : query
            ? `Results for "${query}"`
            : "All Products"}
        </h1>
        <p className="mt-1 text-gray-500 text-sm">
          {products.length} product{products.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Category Pills */}
        <Link
          href="/products"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            !categorySlug
              ? "bg-brand text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}${query ? `&q=${query}` : ""}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              categorySlug === cat.slug
                ? "bg-brand text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.name}
          </Link>
        ))}

        {/* Sort */}
        <div className="ml-auto">
          <SortSelect defaultValue={sort} />
        </div>
      </div>

      {/* Product Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 stagger-children">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            No products found
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Try adjusting your search or browse all categories.
          </p>
          <Link
            href="/products"
            className="px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-full hover:bg-brand-dark transition-colors"
          >
            Browse All
          </Link>
        </div>
      )}
    </div>
  );
}
