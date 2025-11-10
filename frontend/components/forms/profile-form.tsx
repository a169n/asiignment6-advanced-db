"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-context";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { api } from "@/lib/utils";

export function ProfileForm() {
  const { user, loading } = useAuthGuard();
  const { refresh } = useAuth();
  const [bio, setBio] = useState("");
  const [likedProducts, setLikedProducts] = useState("");
  const [purchaseHistory, setPurchaseHistory] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setBio(user.bio ?? "");
      setLikedProducts((user.likedProducts ?? []).join(", "));
      setPurchaseHistory((user.purchaseHistory ?? []).join(", "));
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
      await api.put(`/api/users/${user._id}`, {
        bio,
        likedProducts: likedProducts
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        purchaseHistory: purchaseHistory
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      await refresh();
      setSuccessMessage("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Profile management</CardTitle>
        <CardDescription>Update your profile details to personalize recommendations.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <p className="text-sm text-slate-400">Loading your profile...</p>
        ) : user ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="space-y-2 text-sm">
              <span>Bio</span>
              <Textarea value={bio} onChange={(event) => setBio(event.target.value)} />
            </label>
            <label className="space-y-2 text-sm">
              <span>Liked products (comma separated product IDs)</span>
              <Input value={likedProducts} onChange={(event) => setLikedProducts(event.target.value)} />
            </label>
            <label className="space-y-2 text-sm">
              <span>Purchase history (comma separated product IDs)</span>
              <Input value={purchaseHistory} onChange={(event) => setPurchaseHistory(event.target.value)} />
            </label>
            {successMessage && <p className="text-sm text-emerald-400">{successMessage}</p>}
            {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
            <CardFooter className="px-0">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save profile"}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <p className="text-sm text-slate-400">Log in to edit your profile.</p>
        )}
      </CardContent>
    </Card>
  );
}
