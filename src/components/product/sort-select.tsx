"use client";

export function SortSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select
      defaultValue={defaultValue}
      onChange={(e) => {
        const url = new URL(window.location.href);
        url.searchParams.set("sort", e.target.value);
        window.location.href = url.toString();
      }}
      className="h-10 px-4 pr-8 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30"
    >
      <option value="newest">Newest</option>
      <option value="price-low">Price: Low to High</option>
      <option value="price-high">Price: High to Low</option>
    </select>
  );
}
