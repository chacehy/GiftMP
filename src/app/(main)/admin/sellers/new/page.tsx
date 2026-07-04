"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSellerWithShop, promoteBuyerToSeller } from "@/actions/admin.actions";
import { UserPlus, ArrowRight, Sparkles, Store } from "lucide-react";
import { slugify } from "@/lib/utils";

type Mode = "create" | "promote";

export default function AddSellerPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("create");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopSlug, setShopSlug] = useState("");
  const [shopDescription, setShopDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleShopNameChange = (v: string) => {
    setShopName(v);
    setShopSlug(slugify(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const shop = { name: shopName, slug: shopSlug, description: shopDescription || undefined };

    const result =
      mode === "create"
        ? await createSellerWithShop({ name, email, shop })
        : await promoteBuyerToSeller({ email, shop });

    if (result.success) {
      router.push("/admin/sellers");
      router.refresh();
    } else {
      setError(result.error || "Failed to add seller.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-brand-cream flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-brand" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 font-[Outfit]">Add a Seller</h1>
        <p className="mt-2 text-gray-500 text-sm">
          Seller accounts and shops can only be created by an admin.
        </p>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            mode === "create" ? "bg-white text-brand shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Create New Seller
        </button>
        <button
          type="button"
          onClick={() => setMode("promote")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            mode === "promote" ? "bg-white text-brand shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Promote Existing Buyer
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {mode === "create" ? "New Account" : "Existing Buyer"}
            </p>

            {mode === "create" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
                  placeholder="Jane Doe"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
                placeholder="seller@example.com"
              />
              {mode === "promote" && (
                <p className="mt-1.5 text-xs text-gray-400">Must match an existing buyer account.</p>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 pt-4">
              <Store className="w-3.5 h-3.5" /> Shop Details
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop Name</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => handleShopNameChange(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
                placeholder="Artisan Shop"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop URL</label>
              <div className="flex items-center gap-0 rounded-xl border border-gray-200 overflow-hidden bg-gray-50/50">
                <span className="px-3 text-sm text-gray-400 bg-gray-100 h-11 flex items-center shrink-0">
                  /shop/
                </span>
                <input
                  type="text"
                  value={shopSlug}
                  onChange={(e) => setShopSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  required
                  minLength={3}
                  maxLength={50}
                  className="flex-1 h-11 px-3 text-sm focus:outline-none bg-transparent"
                  placeholder="my-shop"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={shopDescription}
                onChange={(e) => setShopDescription(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
                placeholder="Tell buyers about this shop..."
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{error}</div>
          )}

          {mode === "create" && (
            <p className="text-xs text-gray-400">
              The seller will receive an email to set their own password.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand/25"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {mode === "create" ? "Create Seller" : "Promote to Seller"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
