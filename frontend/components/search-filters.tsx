"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchFiltersProps {
  categories: string[];
}

export function SearchFilters({ categories }: SearchFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [minPrice, setMinPrice] = useState(params.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") ?? "");

  const uniqueCategories = useMemo(() => Array.from(new Set(categories)).sort(), [categories]);

  const handleApply = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextParams = new URLSearchParams(params.toString());
    if (category) nextParams.set("category", category);
    else nextParams.delete("category");
    if (minPrice) nextParams.set("minPrice", minPrice);
    else nextParams.delete("minPrice");
    if (maxPrice) nextParams.set("maxPrice", maxPrice);
    else nextParams.delete("maxPrice");
    const query = nextParams.toString();
    router.push(query ? `/?${query}` : "/");
  };

  return (
    <form onSubmit={handleApply} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <label className="flex flex-col text-sm text-slate-300">
        Category
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="mt-1 h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <option value="">All</option>
          {uniqueCategories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-sm text-slate-300">
        Min price
        <Input
          className="mt-1"
          type="number"
          value={minPrice}
          onChange={(event) => setMinPrice(event.target.value)}
          placeholder="0"
        />
      </label>
      <label className="flex flex-col text-sm text-slate-300">
        Max price
        <Input
          className="mt-1"
          type="number"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
          placeholder="500"
        />
      </label>
      <Button type="submit" className="ml-auto">
        Apply filters
      </Button>
    </form>
  );
}
