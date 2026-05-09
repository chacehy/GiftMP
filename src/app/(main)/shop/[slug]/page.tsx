import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { Store, Calendar } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const shop = await prisma.shop.findUnique({ where: { slug }, select: { name: true, description: true } });
    if (!shop) return { title: "Shop Not Found" };
    return { title: shop.name, description: shop.description || `Browse products from ${shop.name}` };
  } catch {
    return { title: "Shop" };
  }
}

export default async function ShopStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let shop: any = null;
  try {
    shop = await prisma.shop.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isPublished: true },
          include: {
            images: { orderBy: { position: "asc" }, take: 1 },
            shop: { select: { name: true, slug: true } },
            reviews: { select: { rating: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { products: { where: { isPublished: true } } } },
      },
    });
  } catch {}

  if (!shop) notFound();

  return (
    <div>
      {/* Shop Header */}
      <div className="bg-gradient-to-r from-brand-cream to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center text-3xl font-bold text-brand font-[Outfit]">
              {shop.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-[Outfit]">
                {shop.name}
              </h1>
              {shop.description && (
                <p className="mt-1 text-gray-600 text-sm max-w-lg">{shop.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Store className="w-3.5 h-3.5" />
                  {shop._count.products} products
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {new Date(shop.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {shop.products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 stagger-children">
            {shop.products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400">This shop hasn&apos;t listed any products yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
