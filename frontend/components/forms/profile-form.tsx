"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useUpdateProfile, useUsers } from "@/hooks/use-products";
import type { User } from "@/types";

export function ProfileForm() {
  const { data: users } = useUsers();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const selectedUser = useMemo(() => users?.find((user) => user._id === selectedUserId), [
    users,
    selectedUserId
  ]);
  const [bio, setBio] = useState("");
  const [likedProducts, setLikedProducts] = useState("");
  const [purchaseHistory, setPurchaseHistory] = useState("");
  const updateProfile = useUpdateProfile(selectedUserId || undefined);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUserId) return;
    setMessage(null);
    try {
      await updateProfile.mutateAsync({
        bio,
        likedProducts: likedProducts.split(",").map((item) => item.trim()).filter(Boolean),
        purchaseHistory: purchaseHistory.split(",").map((item) => item.trim()).filter(Boolean)
      } as Partial<User>);
      setMessage("Profile updated successfully!");
    } catch (error) {
      console.error(error);
    }
  };

  const handleUserSelection = (value: string) => {
    setSelectedUserId(value);
    const user = users?.find((item) => item._id === value);
    setBio(user?.bio ?? "");
    setLikedProducts((user?.likedProducts ?? []).join(", "));
    setPurchaseHistory((user?.purchaseHistory ?? []).join(", "));
  };

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Profile management</CardTitle>
        <CardDescription>Select a user to update their profile details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <label className="space-y-2 text-sm">
          <span>Select user</span>
          <select
            value={selectedUserId}
            onChange={(event) => handleUserSelection(event.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <option value="">Select a user</option>
            {users?.map((user) => (
              <option key={user._id} value={user._id}>
                {user.username}
              </option>
            ))}
          </select>
        </label>
        {selectedUser ? (
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
            {message && <p className="text-sm text-emerald-400">{message}</p>}
            <CardFooter className="px-0">
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Saving..." : "Save profile"}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <p className="text-sm text-slate-400">Choose a user to edit their profile.</p>
        )}
      </CardContent>
    </Card>
  );
}
