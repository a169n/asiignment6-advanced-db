"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
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
  const [liked, setLiked] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const viewTrackedRef = useRef(false);

  // Track liked state from user
  useEffect(() => {
    if (!user?._id || !data?._id) return;
    setLiked(user.likedProducts?.includes(data._id) ?? false);
  }, [user?._id, user?.likedProducts, data?._id]);

  // Track view interaction - only once per product/user combination
  useEffect(() => {
    if (!user?._id || !data?._id || viewTrackedRef.current) return;
    
    const timer = setTimeout(() => {
      viewTrackedRef.current = true;
      trackInteraction.mutate({ productId: data._id, type: "view" });
    }, 400);
    
    return () => clearTimeout(timer);
  }, [user?._id, data?._id]);

  // Reset view tracking when product changes
  useEffect(() => {
    viewTrackedRef.current = false;
  }, [productId]);

  const handleInteraction = async (type: "purchase" | "like") => {
    if (!user?._id || !data?._id) return;
    
    setFeedback(null);
    try {
      const result = await trackInteraction.mutateAsync({ productId: data._id, type });
      
      if (type === "like") {
        const nextLiked = !(result && typeof result === "object" && "liked" in result)
          ? !liked
          : Boolean((result as { liked?: boolean }).liked);
        setLiked(nextLiked);
        setFeedback(nextLiked ? "Saved to your likes" : "Removed from likes");
      } else if (type === "purchase") {
        setFeedback("Added to order");
      }
      
      // Clear feedback after 3 seconds
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error(error);
      setFeedback("Failed to track interaction. Please try again.");
      setTimeout(() => setFeedback(null), 3000);
    }
  };

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
    <div className="space-y-6">
      {feedback && (
        <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">
          {feedback}
        </div>
      )}
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
            <Button 
              variant="default" 
              onClick={() => handleInteraction("purchase")}
              disabled={trackInteraction.isPending}
            >
              Add to order
            </Button>
            <Button 
              variant={liked ? "default" : "secondary"} 
              onClick={() => handleInteraction("like")}
              disabled={trackInteraction.isPending}
            >
              {liked ? "Remove from likes" : "Save to likes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
