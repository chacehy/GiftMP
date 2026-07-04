import { listSellers } from "@/actions/admin.actions";
import { timeAgo, getInitials } from "@/lib/utils";
import Link from "next/link";
import { Plus, Store, ExternalLink } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sellers" };

export default async function AdminSellersPage() {
  const sellers = await listSellers();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-[Outfit]">Sellers</h1>
        <Link
          href="/admin/sellers/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Seller
        </Link>
      </div>

      {sellers.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-500 mb-4">No sellers yet</p>
          <Link
            href="/admin/sellers/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Seller
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sellers.map((seller) => (
            <div
              key={seller.id}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-brand-cream text-brand-dark flex items-center justify-center text-sm font-semibold shrink-0">
                {getInitials(seller.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{seller.name}</h3>
                  {seller.shop ? (
                    <span className="badge badge-success text-[10px]">
                      <Store className="w-3 h-3 mr-0.5" /> {seller.shop.name}
                    </span>
                  ) : (
                    <span className="badge badge-warning text-[10px]">No shop</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{seller.email}</span>
                  <span>Joined {timeAgo(seller.createdAt)}</span>
                  {seller.shop && (
                    <>
                      <span>{seller.shop._count.products} products</span>
                      <span>{seller.shop._count.orders} orders</span>
                    </>
                  )}
                </div>
              </div>
              {seller.shop && (
                <Link
                  href={`/shop/${seller.shop.slug}`}
                  target="_blank"
                  className="p-2 rounded-lg text-gray-400 hover:text-brand hover:bg-gray-50 transition-colors shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
