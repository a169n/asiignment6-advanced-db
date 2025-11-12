"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTrackInteraction } from "@/hooks/use-products";
import { useAuth } from "@/components/auth/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const trackInteraction = useTrackInteraction();
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);
  const tags = useMemo(() => product.tags ?? [], [product.tags]);

  useEffect(() => {
    if (!user?._id) return;
    setLiked(user.likedProducts?.includes(product._id) ?? false);
  }, [user?._id, user?.likedProducts, product._id]);

  const handleInteraction = async (type: "view" | "like" | "purchase") => {
    if (!user?._id) return;
    setFeedback(null);
    try {
      const result = await trackInteraction.mutateAsync({ productId: product._id, type });
      if (type === "like") {
        const nextLiked = !(result && typeof result === "object" && "liked" in result)
          ? !liked
          : Boolean((result as { liked?: boolean }).liked);
        setLiked(nextLiked);
        setFeedback(nextLiked ? "Saved to your likes" : "Removed from likes");
      } else if (type === "purchase") {
        setFeedback("Purchase recorded");
      } else if (type === "view") {
        setFeedback("View tracked");
      }
    } catch (error) {
      console.error(error);
      setFeedback("Failed to track interaction. Please try again.");
    }
  };

  return (
    <Card className="space-y-4 transition hover:border-indigo-500">
      <CardHeader>
        <CardTitle>{product.productName}</CardTitle>
        <CardDescription>{product.category}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative h-48 w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
          {!imageReady && !imageError && <Skeleton className="h-full w-full" />}
          {imageError ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Image unavailable
            </div>
          ) : (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt ?? product.productName}
              fill
              className={cn("object-cover transition-transform duration-300", imageReady ? "scale-100" : "scale-105")}
              sizes="(min-width: 1024px) 320px, (min-width: 768px) 280px, 100vw"
              onLoadingComplete={() => setImageReady(true)}
              onError={() => setImageError(true)}
              priority={false}
            />
          )}
        </div>
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span className="font-semibold text-indigo-300">${product.price.toFixed(2)}</span>
          {product.rating ? <span aria-label={`Rated ${product.rating} out of 5`}>⭐ {product.rating.toFixed(1)}</span> : null}
        </div>
        <p className="text-sm text-slate-300">{product.description}</p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          {tags.map((tag) => (
            <span key={tag} className="rounded bg-slate-800 px-2 py-1">
              #{tag}
            </span>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant={liked ? "default" : "outline"}
              onClick={() => handleInteraction("like")}
              disabled={trackInteraction.isPending}
              aria-pressed={liked}
              aria-label={liked ? "Unlike product" : "Like product"}
            >
              {liked ? "♥ Liked" : "♡ Like"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/products/${product._id}`)}
              aria-label="View product details"
            >
              View
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => handleInteraction("view")}
              disabled={trackInteraction.isPending}
            >
              Quick view
            </Button>
            <Button variant="default" onClick={() => handleInteraction("purchase")} disabled={trackInteraction.isPending}>
              Buy now
            </Button>
          </div>
        </div>
        {feedback && <p className="mt-3 text-xs text-slate-400">{feedback}</p>}
      </CardFooter>
    </Card>
  );
}
