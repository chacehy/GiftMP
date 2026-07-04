"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AddToCartButton } from "@/components/product/add-to-cart-button";

type VariantOption = { id: string; label: string; priceDelta: number; stock: number };
type Variant = { id: string; name: string; options: VariantOption[] } | null;

export function ProductPurchasePanel({
  productId,
  basePrice,
  stock,
  variant,
}: {
  productId: string;
  basePrice: number;
  stock: number;
  variant: Variant;
}) {
  const [selected, setSelected] = useState<VariantOption | null>(null);
  const price = basePrice + (selected?.priceDelta ?? 0);

  return (
    <>
      <div className="mb-2">
        <span className="text-3xl font-bold text-gray-900">{formatCurrency(price)}</span>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Package className="w-4 h-4 text-gray-400" />
        {variant ? (
          selected ? (
            selected.stock > 0 ? (
              <span className="text-sm">
                <span className="font-medium text-green-600">In stock</span>
                <span className="text-gray-400"> — {selected.stock} available</span>
              </span>
            ) : (
              <span className="text-sm font-medium text-red-500">Out of stock</span>
            )
          ) : (
            <span className="text-sm text-gray-400">Select an option to see availability</span>
          )
        ) : stock > 0 ? (
          <span className="text-sm">
            <span className="font-medium text-green-600">In stock</span>
            <span className="text-gray-400"> — {stock} available</span>
          </span>
        ) : (
          <span className="text-sm font-medium text-red-500">Out of stock</span>
        )}
      </div>

      <AddToCartButton productId={productId} stock={stock} variant={variant} onOptionChange={setSelected} />
    </>
  );
}
