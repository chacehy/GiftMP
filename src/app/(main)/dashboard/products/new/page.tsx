"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/actions/product.actions";
import { ArrowLeft, Upload, X, Save } from "lucide-react";
import Link from "next/link";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [categoryId, setCategoryId] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [imageUrls, setImageUrls] = useState<string[]>([""]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const images = imageUrls.filter((url) => url.trim() !== "");
    if (images.length === 0) {
      setError("Add at least one image URL.");
      setLoading(false);
      return;
    }

    const result = await createProduct({
      title,
      description,
      price: Number(price),
      stock: Number(stock),
      categoryId,
      isPublished,
      images,
    });

    if (result.success) {
      router.push("/dashboard/products");
      router.refresh();
    } else {
      setError(result.error || "Failed to create product.");
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/products" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 font-[Outfit]">New Product</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={5}
              maxLength={100}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
              placeholder="Handmade Silver Ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
              placeholder="Describe your product in detail..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (DZD)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="1"
                step="0.01"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
                placeholder="2500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                min="0"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
                placeholder="10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Image URLs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Image URLs
            </label>
            {imageUrls.map((url, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    const newUrls = [...imageUrls];
                    newUrls[i] = e.target.value;
                    setImageUrls(newUrls);
                  }}
                  className="flex-1 h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
                  placeholder="https://example.com/image.jpg"
                />
                {imageUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setImageUrls(imageUrls.filter((_, j) => j !== i))}
                    className="p-2.5 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setImageUrls([...imageUrls, ""])}
              className="text-sm text-brand font-medium hover:text-brand-dark"
            >
              + Add another image
            </button>
          </div>

          {/* Published toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand/30"
            />
            <span className="text-sm font-medium text-gray-700">Publish immediately</span>
          </label>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Create Product
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
