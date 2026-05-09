import Link from "next/link";
import { Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price: any;
    images: { url: string; altText?: string | null }[];
    shop: { name: string; slug: string };
    reviews: { rating: number }[];
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;
  const imageUrl = product.images[0]?.url || "/placeholder-product.svg";

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-brand/20 hover:shadow-hover transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={product.images[0]?.altText || product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4">
        <p className="text-xs text-gray-400 mb-1 truncate">
          {product.shop.name}
        </p>
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-2 group-hover:text-brand transition-colors">
          {product.title}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-bold text-gray-900">
            {formatCurrency(Number(product.price))}
          </span>
          {avgRating > 0 && (
            <div className="flex items-center gap-0.5 text-xs">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-gray-600">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-gray-400">
                ({product.reviews.length})
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
