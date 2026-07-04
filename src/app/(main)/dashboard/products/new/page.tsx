"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProductForm } from "@/components/forms/product-form";

export default function NewProductPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/products" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 font-[Outfit]">New Product</h1>
      </div>

      <ProductForm mode="create" />
    </div>
  );
}
