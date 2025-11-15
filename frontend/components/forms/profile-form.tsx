"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/auth-context";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useInteractions } from "@/hooks/use-products";
import { api } from "@/lib/utils";
import type { InteractionEntry } from "@/types";

function ProductListItem({ interaction }: { interaction: InteractionEntry }) {
  const router = useRouter();
  const product = interaction.product;

  return (
    <Card className="group cursor-pointer transition hover:border-indigo-500" onClick={() => router.push(`/products/${product._id}`)}>
      <div className="flex gap-4">
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
          <Image
            src={product.imageUrl}
            alt={product.imageAlt ?? product.productName}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
        <div className="flex flex-1 flex-col justify-between py-2">
          <div>
            <h3 className="font-semibold text-white group-hover:text-indigo-300">{product.productName}</h3>
            <p className="text-xs text-slate-400">{product.category}</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-indigo-300">${product.price.toFixed(2)}</span>
            <span className="text-xs text-slate-500">
              {new Date(interaction.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ProductList({ interactions, emptyMessage }: { interactions: InteractionEntry[]; emptyMessage: string }) {
  if (interactions.length === 0) {
    return <p className="text-sm text-slate-400">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-3">
      {interactions.map((interaction) => (
        <ProductListItem key={interaction._id} interaction={interaction} />
      ))}
    </div>
  );
}

export function ProfileForm() {
  const { user, loading } = useAuthGuard();
  const { refresh } = useAuth();
  const [bio, setBio] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const likedParams = useMemo(() => {
    const params = new URLSearchParams();
    params.append("types", "like");
    params.append("limit", "50");
    return params;
  }, []);

  const purchaseParams = useMemo(() => {
    const params = new URLSearchParams();
    params.append("types", "purchase");
    params.append("limit", "50");
    return params;
  }, []);

  const { data: likedData, isLoading: likedLoading } = useInteractions(user?._id ?? "", likedParams);
  const { data: purchaseData, isLoading: purchaseLoading } = useInteractions(user?._id ?? "", purchaseParams);

  useEffect(() => {
    if (user) {
      setBio(user.bio ?? "");
    }
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    if (!user) {
      return;
    }
    try {
      setSubmitting(true);
      await api.put(`/api/users/${user._id}`, { bio });
      await refresh();
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to update profile. Please try again.");
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const likedInteractions = likedData?.interactions ?? [];
  const purchaseInteractions = purchaseData?.interactions ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Update your bio to personalize your profile.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : user ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="space-y-2 text-sm">
                <span>Bio</span>
                <Textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Tell us about yourself..." />
              </label>
              {successMessage && <p className="text-sm text-emerald-400">{successMessage}</p>}
              {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
              <CardFooter className="px-0">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save bio"}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <p className="text-sm text-slate-400">Log in to edit your profile.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liked Products</CardTitle>
          <CardDescription>Products you&apos;ve saved to your likes.</CardDescription>
        </CardHeader>
        <CardContent>
          {likedLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <ProductList interactions={likedInteractions} emptyMessage="You haven't liked any products yet." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>Products you&apos;ve purchased.</CardDescription>
        </CardHeader>
        <CardContent>
          {purchaseLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <ProductList interactions={purchaseInteractions} emptyMessage="You haven't purchased any products yet." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
