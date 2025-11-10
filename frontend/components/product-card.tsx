"use client";

import { useMemo, useState } from "react";
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

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const trackInteraction = useTrackInteraction();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const tags = useMemo(() => product.tags ?? [], [product.tags]);

  const handleInteraction = async (type: "view" | "like" | "purchase") => {
    if (!user?._id) return;
    setFeedback(null);
    try {
      await trackInteraction.mutateAsync({ productId: product._id, type });
      if (type === "like") {
        setLiked(true);
        setFeedback("Saved to your likes");
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
      <CardContent>
        <p>{product.description}</p>
        <p className="text-lg font-semibold text-indigo-300">${product.price.toFixed(2)}</p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          {tags.map((tag) => (
            <span key={tag} className="rounded bg-slate-800 px-2 py-1">
              #{tag}
            </span>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => handleInteraction("view")} disabled={trackInteraction.isPending}>
            {trackInteraction.isPending ? "Saving..." : "Track view"}
          </Button>
          <Button variant="default" onClick={() => handleInteraction("purchase")} disabled={trackInteraction.isPending}>
            Purchase
          </Button>
          <Button
            variant={liked ? "ghost" : "outline"}
            onClick={() => handleInteraction("like")}
            disabled={liked || trackInteraction.isPending}
          >
            {liked ? "Liked" : "Like"}
          </Button>
        </div>
        {feedback && <p className="mt-3 text-xs text-slate-400">{feedback}</p>}
      </CardFooter>
    </Card>
  );
}
