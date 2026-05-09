"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { updateCartItemQuantity, removeCartItem } from "@/actions/cart.actions";

export function CartActions({
  cartItemId,
  quantity,
  stock,
}: {
  cartItemId: string;
  quantity: number;
  stock: number;
}) {
  const [loading, setLoading] = useState(false);
  const [currentQty, setCurrentQty] = useState(quantity);

  const handleUpdate = async (newQty: number) => {
    setLoading(true);
    setCurrentQty(newQty);
    await updateCartItemQuantity({ cartItemId, quantity: newQty });
    setLoading(false);
  };

  const handleRemove = async () => {
    setLoading(true);
    await removeCartItem(cartItemId);
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => handleUpdate(Math.max(1, currentQty - 1))}
          disabled={loading || currentQty <= 1}
          className="p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-8 text-center text-xs font-medium">{currentQty}</span>
        <button
          type="button"
          onClick={() => handleUpdate(Math.min(stock, currentQty + 1))}
          disabled={loading || currentQty >= stock}
          className="p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <button
        onClick={handleRemove}
        disabled={loading}
        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
