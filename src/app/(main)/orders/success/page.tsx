import Link from "next/link";
import { CheckCircle, ArrowRight, Package } from "lucide-react";

export default function OrderSuccessPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="text-center animate-scale-in max-w-md">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 font-[Outfit] mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-500 mb-8">
          Your order has been placed. The seller will prepare your items for shipping.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/orders"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-full hover:bg-brand-dark transition-colors"
          >
            <Package className="w-4 h-4" />
            View My Orders
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 transition-colors"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
