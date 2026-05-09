"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createShop } from "@/actions/shop.actions";
import { Store, ArrowRight, Sparkles } from "lucide-react";
import { slugify } from "@/lib/utils";

export default function CreateShopPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (v: string) => {
    setName(v);
    setSlug(slugify(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await createShop({ name, slug, description });
    if (result.success) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(result.error || "Failed to create shop.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-cream flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-brand" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 font-[Outfit]">Open Your Shop</h1>
          <p className="mt-2 text-gray-500">Start selling your handmade creations today</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
                placeholder="My Artisan Shop"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop URL</label>
              <div className="flex items-center gap-0 rounded-xl border border-gray-200 overflow-hidden bg-gray-50/50">
                <span className="px-3 text-sm text-gray-400 bg-gray-100 h-11 flex items-center shrink-0">
                  giftmp.com/shop/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
                placeholder="Tell buyers about your shop and what makes it special..."
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{error}</div>
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
                  Create My Shop
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
