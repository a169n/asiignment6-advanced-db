"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Pagination } from "@/types";

interface SearchFiltersProps {
  categories: string[];
  pagination?: Pagination;
}

export function SearchFilters({ categories, pagination }: SearchFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [minPrice, setMinPrice] = useState(params.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") ?? "");
  const [sort, setSort] = useState(params.get("sort") ?? "relevance");

  const uniqueCategories = useMemo(() => Array.from(new Set(categories)).sort(), [categories]);

  const handleApply = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextParams = new URLSearchParams(params.toString());
    if (search) nextParams.set("q", search);
    else nextParams.delete("q");
    if (category) nextParams.set("category", category);
    else nextParams.delete("category");
    if (minPrice) nextParams.set("minPrice", minPrice);
    else nextParams.delete("minPrice");
    if (maxPrice) nextParams.set("maxPrice", maxPrice);
    else nextParams.delete("maxPrice");
    if (sort) nextParams.set("sort", sort);
    else nextParams.delete("sort");
    nextParams.delete("page");
    const query = nextParams.toString();
    router.push(query ? `/?${query}` : "/");
  };

  return (
    <form
      onSubmit={handleApply}
      className="grid gap-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-4 lg:grid-cols-6"
      role="search"
      aria-label="Product filters"
    >
      <label className="flex flex-col text-sm text-slate-300 md:col-span-2">
        Search
        <Input
          className="mt-1"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products"
        />
      </label>
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
          min="0"
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
          min="0"
        />
      </label>
      <label className="flex flex-col text-sm text-slate-300">
        Sort by
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="mt-1 h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <option value="relevance">Relevance</option>
          <option value="newest">Newest</option>
          <option value="priceAsc">Price: Low to High</option>
          <option value="priceDesc">Price: High to Low</option>
          <option value="rating">Rating</option>
          <option value="popularity">Popularity</option>
        </select>
      </label>
      <div className="flex items-center gap-3 md:col-span-2">
        <Button type="submit" className="w-full md:w-auto">
          Apply filters
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setSearch("");
            setCategory("");
            setMinPrice("");
            setMaxPrice("");
            setSort("relevance");
            router.push("/");
          }}
        >
          Reset
        </Button>
      </div>
      {pagination && (
        <p className="md:col-span-2 text-xs text-slate-400" aria-live="polite">
          Showing page {pagination.page} of {pagination.pageCount}
        </p>
      )}
    </form>
  );
}
