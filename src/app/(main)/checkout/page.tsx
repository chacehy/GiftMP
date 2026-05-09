"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/actions/order.actions";
import { MapPin, CreditCard, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export default function CheckoutPage() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await createOrder(address);

    if (result.success && result.url) {
      // Redirect to Chargily checkout
      window.location.href = result.url;
    } else {
      setError(result.error || "Failed to process checkout.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-[Outfit] mb-8">
        Checkout
      </h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 animate-fade-in-up">
        <form onSubmit={handleCheckout} className="space-y-6">
          {/* Shipping Address */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
            </div>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              rows={3}
              placeholder="Enter your full address (Wilaya, Commune, Street, etc.)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50/50"
            />
          </div>

          {/* Payment Info */}
          <div className="p-4 rounded-xl bg-brand-cream/50 border border-brand/10">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-brand" />
              <h3 className="font-medium text-gray-900">Payment via Chargily</h3>
            </div>
            <p className="text-sm text-gray-600">
              You will be securely redirected to Chargily Pay to complete your payment in DZD.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand/25 active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Pay with Chargily
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
