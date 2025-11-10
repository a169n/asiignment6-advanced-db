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

interface ProductCardProps {
  product: Product;
  userId?: string;
}

export function ProductCard({ product, userId }: ProductCardProps) {
  const trackInteraction = useTrackInteraction();
  const [liked, setLiked] = useState(false);
  const tags = useMemo(() => product.tags ?? [], [product.tags]);

  const handleInteraction = async (type: "view" | "like" | "purchase") => {
    if (!userId) return;
    try {
      await trackInteraction.mutateAsync({ userId, productId: product._id, type });
      if (type === "like") {
        setLiked(true);
      }
    } catch (error) {
      console.error(error);
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
          <Button variant="outline" onClick={() => handleInteraction("view")}>Track view</Button>
          <Button variant="default" onClick={() => handleInteraction("purchase")}>
            Purchase
          </Button>
          <Button variant={liked ? "ghost" : "outline"} onClick={() => handleInteraction("like")} disabled={liked}>
            {liked ? "Liked" : "Like"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
