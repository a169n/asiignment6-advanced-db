"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useProduct, useTrackInteraction } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductDetailProps {
  productId: string;
}

export function ProductDetail({ productId }: ProductDetailProps) {
  const { user, loading: authLoading } = useAuthGuard();
  const trackInteraction = useTrackInteraction();
  const router = useRouter();
  const { data, isLoading, isError, error } = useProduct(productId, !authLoading);

  useEffect(() => {
    if (!user?._id || !data?._id) return;
    const timer = setTimeout(() => {
      trackInteraction.mutate({ productId: data._id, type: "view" });
    }, 400);
    return () => clearTimeout(timer);
  }, [user?._id, data?._id, trackInteraction]);

  if (authLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-3 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
        <p>{error instanceof Error ? error.message : "Product not found."}</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="relative h-[28rem] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <Image
          src={data.imageUrl}
          alt={data.imageAlt ?? data.productName}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-indigo-300">{data.category}</p>
          <h1 className="text-3xl font-bold text-white">{data.productName}</h1>
          <p className="text-xl font-semibold text-indigo-300">${data.price.toFixed(2)}</p>
        </div>
        <p className="text-sm leading-relaxed text-slate-300">{data.description}</p>
        {data.tags?.length ? (
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            {data.tags.map((tag) => (
              <span key={tag} className="rounded bg-slate-800 px-2 py-1">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button variant="default" onClick={() => trackInteraction.mutate({ productId: data._id, type: "purchase" })}>
            Add to order
          </Button>
          <Button variant="secondary" onClick={() => trackInteraction.mutate({ productId: data._id, type: "like" })}>
            Save to likes
          </Button>
        </div>
      </div>
    </div>
  );
}
