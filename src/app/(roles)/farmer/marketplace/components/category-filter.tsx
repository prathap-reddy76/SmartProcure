"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CategoryItem } from "@/actions/marketplace/category-actions";

export function CategoryFilter({ categories }: { categories: CategoryItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "all";

  const handleSelect = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === "all") {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    params.delete("page"); // Reset page on category change
    router.push(`/farmer/marketplace?${params.toString()}`);
  };

  const totalProducts = categories.reduce((sum, c) => sum + c.productCount, 0);

  return (
    <div className="overflow-x-auto pb-2 scrollbar-none">
      <div className="flex items-center gap-2 min-w-max">
        <button
          onClick={() => handleSelect("all")}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-2xs ${
            currentCategory === "all"
              ? "bg-green-700 text-white shadow-xs"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-green-50 hover:text-green-800"
          }`}
        >
          All Items ({totalProducts})
        </button>

        {categories.map((cat) => {
          const isSelected = currentCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => handleSelect(cat.slug)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 ${
                isSelected
                  ? "bg-green-700 text-white shadow-xs"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-green-50 hover:text-green-800"
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-green-800 text-green-100" : "bg-gray-100 text-gray-500"
                }`}
              >
                {cat.productCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
