"use client";

import { useState } from "react";

type ProductImage = { id: string; url: string; altText: string | null };

export function ProductGallery({ images, title }: { images: ProductImage[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  return (
    <div className="space-y-3">
      <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
        <img
          src={active?.url || "/placeholder-product.svg"}
          alt={active?.altText || title}
          className="w-full h-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {images.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 transition-colors ${
                index === activeIndex ? "border-brand" : "border-transparent hover:border-brand/40"
              }`}
            >
              <img src={img.url} alt={img.altText || title} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
