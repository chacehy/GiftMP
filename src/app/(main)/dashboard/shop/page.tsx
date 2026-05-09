"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateShop } from "@/actions/shop.actions";
import { Save, ExternalLink, Check } from "lucide-react";
import Link from "next/link";

export default function ShopSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [shop, setShop] = useState<any>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetch("/api/my-shop")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setShop(data);
          setName(data.name || "");
          setSlug(data.slug || "");
          setDescription(data.description || "");
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const result = await updateShop({ name, slug, description });
    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || "Failed to update shop.");
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-[Outfit]">Shop Settings</h1>
        {shop && (
          <Link
            href={`/shop/${shop.slug}`}
            target="_blank"
            className="text-sm text-brand hover:text-brand-dark flex items-center gap-1"
          >
            View Storefront <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop URL Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              required
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
            />
          </div>

          {error && <div className="p-3 rounded-xl bg-red-50 text-sm text-red-600">{error}</div>}
          {success && <div className="p-3 rounded-xl bg-green-50 text-sm text-green-600 flex items-center gap-1.5"><Check className="w-4 h-4" /> Shop updated!</div>}

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-brand text-white font-medium rounded-xl hover:bg-brand-dark transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
