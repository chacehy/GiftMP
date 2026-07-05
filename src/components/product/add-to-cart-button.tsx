"use client";

import { useState } from "react";
import { ShoppingCart, Minus, Plus, Check } from "lucide-react";
import { addToCart } from "@/actions/cart.actions";

type VariantOption = { id: string; label: string; priceDelta: number; stock: number };

export function AddToCartButton({
  productId,
  stock,
  variant,
  onOptionChange,
}: {
  productId: string;
  stock: number;
  variant?: { id: string; name: string; options: VariantOption[] } | null;
  onOptionChange?: (option: VariantOption | null) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const selectedOption = variant?.options.find((o) => o.id === selectedOptionId) ?? null;
  const effectiveStock = variant ? selectedOption?.stock ?? 0 : stock;

  const selectOption = (option: VariantOption) => {
    setSelectedOptionId(option.id);
    setQuantity(1);
    setError("");
    onOptionChange?.(option);
  };

  const handleAdd = async () => {
    if (variant && !selectedOptionId) {
      setError(`Please select a ${variant.name.toLowerCase()}.`);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    const result = await addToCart({
      productId,
      quantity,
      variantOptionId: selectedOptionId ?? undefined,
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } else {
      setError(result.error || "Failed to add to cart.");
    }

    setLoading(false);
  };

  const soldOut = variant ? variant.options.every((o) => o.stock <= 0) : stock <= 0;

  if (soldOut) {
    return (
      <button
        disabled
        className="w-full h-12 bg-gray-100 text-gray-400 font-semibold rounded-xl cursor-not-allowed"
      >
        Out of Stock
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {variant && (
        <div>
          <span className="text-sm font-medium text-gray-700 block mb-2">{variant.name}</span>
          <div className="flex flex-wrap gap-2">
            {variant.options.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={option.stock <= 0}
                onClick={() => selectOption(option)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  selectedOptionId === option.id
                    ? "border-brand bg-brand-cream text-brand-dark"
                    : "border-gray-200 text-gray-700 hover:border-brand/50"
                } ${option.stock <= 0 ? "opacity-40 cursor-not-allowed line-through" : ""}`}
              >
                {option.label}
                {option.priceDelta !== 0 && (
                  <span className="text-xs text-gray-400 ml-1">
                    ({option.priceDelta > 0 ? "+" : ""}
                    {option.priceDelta})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Quantity</span>
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="p-2.5 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(Math.min(Math.max(effectiveStock, 1), quantity + 1))}
            className="p-2.5 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={handleAdd}
        disabled={loading}
        className={`w-full h-12 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
          success
            ? "bg-green-500 text-white"
            : "bg-brand text-white hover:bg-brand-dark hover:shadow-lg hover:shadow-brand/25"
        } disabled:opacity-50`}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : success ? (
          <>
            <Check className="w-5 h-5" />
            Added to Cart!
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </>
        )}
      </button>

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
