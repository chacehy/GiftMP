import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Search,
  ArrowRight,
  Star,
  ShoppingBag,
  Truck,
  Shield,
  Sparkles,
  Gem,
  Home,
  Palette,
  Shirt,
  Scissors,
  Gift,
  type LucideIcon,
} from "lucide-react";
import { ProductCard } from "@/components/product/product-card";

const heroCategories: { name: string; slug: string; icon: LucideIcon }[] = [
  { name: "Jewelry", slug: "jewelry-accessories", icon: Gem },
  { name: "Home Décor", slug: "home-living", icon: Home },
  { name: "Art", slug: "art-collectibles", icon: Palette },
  { name: "Clothing", slug: "clothing-shoes", icon: Shirt },
  { name: "Crafts", slug: "craft-supplies", icon: Scissors },
  { name: "Gifts", slug: "gifts", icon: Gift },
];

const features = [
  {
    icon: Sparkles,
    title: "Handmade with Love",
    desc: "Every item is crafted by talented Algerian artisans",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    desc: "Nationwide shipping across all 58 wilayas",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    desc: "Pay safely with Chargily — Algeria's trusted gateway",
  },
  {
    icon: ShoppingBag,
    title: "Unique Finds",
    desc: "Discover one-of-a-kind gifts you won't find anywhere else",
  },
];

export default async function HomePage() {
  // Fetch some featured products
  let featuredProducts: any[] = [];
  try {
    featuredProducts = await prisma.product.findMany({
      where: { isPublished: true },
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        shop: { select: { name: true, slug: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
  } catch {
    // DB not connected yet, show empty
  }

  return (
    <>
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-cream via-white to-orange-50">
        {/* Decorative blobs */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[400px] h-[400px] bg-orange-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="max-w-2xl animate-fade-in-up">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Algeria&apos;s Handmade Marketplace
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight font-[Outfit]">
              Find gifts that <br />
              <span className="text-brand">tell a story</span>
            </h1>
            <p className="mt-5 text-lg text-gray-600 leading-relaxed max-w-lg">
              Discover unique handmade treasures from Algerian artisans. Every purchase supports a local creator.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white font-semibold rounded-full hover:bg-brand-dark transition-all hover:shadow-lg hover:shadow-brand/25 active:scale-[0.98]"
              >
                Shop Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard/shop/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-full border border-gray-200 hover:border-brand hover:text-brand transition-all hover:shadow-md active:scale-[0.98]"
              >
                Start Selling
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Categories ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 font-[Outfit]">
            Browse by Category
          </h2>
          <p className="mt-2 text-gray-500">
            Find exactly what you&apos;re looking for
          </p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 stagger-children">
          {heroCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-gray-50 hover:bg-brand-cream border border-transparent hover:border-brand/20 transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-cream text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all group-hover:scale-110">
                <cat.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-brand-dark transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Featured Products ─── */}
      {featuredProducts.length > 0 && (
        <section className="bg-gray-50/50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 font-[Outfit]">
                  Fresh Finds
                </h2>
                <p className="mt-1 text-gray-500">
                  Just added by our talented creators
                </p>
              </div>
              <Link
                href="/products"
                className="hidden sm:flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 stagger-children">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/products"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand"
              >
                View all products <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── How It Works ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 font-[Outfit]">
            Why Shop on GiftMP?
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-6 rounded-2xl bg-white border border-gray-100 hover:border-brand/20 hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-cream text-brand flex items-center justify-center mb-4 group-hover:bg-brand group-hover:text-white transition-colors">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand to-brand-dark p-8 sm:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative max-w-lg">
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-[Outfit]">
              Turn your craft into a business
            </h2>
            <p className="mt-3 text-orange-100 leading-relaxed">
              Join hundreds of Algerian artisans who are sharing their work with the world. Setting up your shop takes just minutes.
            </p>
            <Link
              href="/dashboard/shop/create"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-white text-brand font-semibold rounded-full hover:bg-orange-50 transition-all hover:shadow-lg active:scale-[0.98]"
            >
              Open Your Shop — It&apos;s Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
