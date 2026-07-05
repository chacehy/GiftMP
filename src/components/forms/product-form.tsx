"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct, type ProductInput } from "@/actions/product.actions";
import { ImageUploader } from "@/components/forms/image-uploader";
import { Save, Plus, X } from "lucide-react";

type Category = {
  id: string;
  name: string;
  children: { id: string; name: string }[];
};

type VariantOptionDraft = { label: string; priceDelta: string; stock: string };

const TYPE_OPTIONS: { value: ProductInput["type"]; label: string }[] = [
  { value: "HANDMADE", label: "Handmade" },
  { value: "VINTAGE", label: "Vintage (20+ years old)" },
  { value: "SUPPLY", label: "Craft Supply" },
];

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  initial?: {
    title: string;
    description: string;
    price: number;
    stock: number;
    categoryId: string;
    isPublished: boolean;
    images: string[];
    type: ProductInput["type"];
    tags: string[];
    materials: string[];
    processingTime: string;
    personalization: string;
    variant: { name: string; options: VariantOptionDraft[] } | null;
  };
}

export function ProductForm({ mode, productId, initial }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [stock, setStock] = useState(initial ? String(initial.stock) : "1");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [type, setType] = useState<ProductInput["type"]>(initial?.type ?? "HANDMADE");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [materials, setMaterials] = useState(initial?.materials.join(", ") ?? "");
  const [processingTime, setProcessingTime] = useState(initial?.processingTime ?? "");
  const [personalization, setPersonalization] = useState(initial?.personalization ?? "");

  const [hasVariant, setHasVariant] = useState(Boolean(initial?.variant));
  const [variantName, setVariantName] = useState(initial?.variant?.name ?? "Size");
  const [variantOptions, setVariantOptions] = useState<VariantOptionDraft[]>(
    initial?.variant?.options ?? [{ label: "", priceDelta: "0", stock: "0" }]
  );

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  const addVariantOption = () => {
    setVariantOptions([...variantOptions, { label: "", priceDelta: "0", stock: "0" }]);
  };

  const removeVariantOption = (index: number) => {
    setVariantOptions(variantOptions.filter((_, i) => i !== index));
  };

  const updateVariantOption = (index: number, field: keyof VariantOptionDraft, value: string) => {
    const next = [...variantOptions];
    next[index] = { ...next[index], [field]: value };
    setVariantOptions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (images.length === 0) {
      setError("Add at least one photo.");
      return;
    }

    const variant =
      hasVariant && variantName.trim() && variantOptions.some((o) => o.label.trim())
        ? {
            name: variantName.trim(),
            options: variantOptions
              .filter((o) => o.label.trim())
              .map((o) => ({
                label: o.label.trim(),
                priceDelta: Number(o.priceDelta) || 0,
                stock: Number(o.stock) || 0,
              })),
          }
        : undefined;

    setLoading(true);

    const payload: ProductInput = {
      title,
      description,
      price: Number(price),
      stock: Number(stock),
      categoryId,
      isPublished,
      images,
      type,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      materials: materials.split(",").map((m) => m.trim()).filter(Boolean),
      processingTime: processingTime || undefined,
      personalization: personalization || undefined,
      variant,
    };

    const result =
      mode === "create" ? await createProduct(payload) : await updateProduct(productId!, payload);

    if (result.success) {
      router.push("/dashboard/products");
      router.refresh();
    } else {
      setError(result.error || "Failed to save product.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Photos</label>
          <ImageUploader bucket="product-images" value={images} onChange={setImages} maxFiles={8} />
        </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Stock {hasVariant && <span className="text-gray-400 font-normal">(set per option below)</span>}
            </label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              min="0"
              disabled={hasVariant}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50 disabled:bg-gray-100 disabled:text-gray-400"
              placeholder="10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
                <optgroup key={cat.id} label={cat.name}>
                  <option value={cat.id}>{cat.name} (general)</option>
                  {cat.children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Item Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ProductInput["type"])}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tags <span className="text-gray-400 font-normal">(comma-separated, helps buyers find this item)</span>
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
            placeholder="boho, wedding gift, minimalist"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Materials <span className="text-gray-400 font-normal">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
            placeholder="sterling silver, leather"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Processing Time <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={processingTime}
              onChange={(e) => setProcessingTime(e.target.value)}
              maxLength={100}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
              placeholder="3-5 business days"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Personalization Note <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={personalization}
              onChange={(e) => setPersonalization(e.target.value)}
              maxLength={300}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
              placeholder="Add the name you'd like engraved"
            />
          </div>
        </div>

        {/* Variants */}
        <div className="pt-2 border-t border-gray-100">
          <label className="flex items-center gap-3 cursor-pointer pt-4 mb-4">
            <input
              type="checkbox"
              checked={hasVariant}
              onChange={(e) => setHasVariant(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand/30"
            />
            <span className="text-sm font-medium text-gray-700">
              This item comes in different options (e.g. size, color)
            </span>
          </label>

          {hasVariant && (
            <div className="space-y-3 bg-gray-50/70 rounded-xl p-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Option Group Name</label>
                <input
                  type="text"
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  maxLength={50}
                  className="w-full sm:w-64 h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                  placeholder="Size"
                />
              </div>

              <div className="space-y-2">
                {variantOptions.map((option, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) => updateVariantOption(i, "label", e.target.value)}
                      className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                      placeholder="Small"
                    />
                    <input
                      type="number"
                      value={option.priceDelta}
                      onChange={(e) => updateVariantOption(i, "priceDelta", e.target.value)}
                      step="0.01"
                      className="w-28 h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                      placeholder="+0 DZD"
                    />
                    <input
                      type="number"
                      value={option.stock}
                      onChange={(e) => updateVariantOption(i, "stock", e.target.value)}
                      min="0"
                      className="w-24 h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                      placeholder="Stock"
                    />
                    {variantOptions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariantOption(i)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addVariantOption}
                className="inline-flex items-center gap-1.5 text-sm text-brand font-medium hover:text-brand-dark"
              >
                <Plus className="w-3.5 h-3.5" /> Add option
              </button>
              <p className="text-xs text-gray-400">
                Price adjustment is added to (or subtracted from) the base price. Leave at 0 for no change.
              </p>
            </div>
          )}
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
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{error}</div>
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
              {mode === "create" ? "Create Product" : "Save Changes"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
