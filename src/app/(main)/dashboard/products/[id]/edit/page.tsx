import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMyProduct } from "@/actions/product.actions";
import { ProductForm } from "@/components/forms/product-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getMyProduct(id);

  if (!product) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/products" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 font-[Outfit]">Edit Product</h1>
      </div>

      <ProductForm
        mode="edit"
        productId={product.id}
        initial={{
          title: product.title,
          description: product.description,
          price: Number(product.price),
          stock: product.stock,
          categoryId: product.categoryId,
          isPublished: product.isPublished,
          images: product.images.map((img) => img.url),
          type: product.type,
          tags: product.tags,
          materials: product.materials,
          processingTime: product.processingTime ?? "",
          personalization: product.personalization ?? "",
          variant: product.variant
            ? {
                name: product.variant.name,
                options: product.variant.options.map((o) => ({
                  label: o.label,
                  priceDelta: String(o.priceDelta),
                  stock: String(o.stock),
                })),
              }
            : null,
        }}
      />
    </div>
  );
}
