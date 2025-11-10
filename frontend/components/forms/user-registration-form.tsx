"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRegisterUser } from "@/hooks/use-products";

export function UserRegistrationForm() {
  const registerUser = useRegisterUser();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage(null);
    try {
      await registerUser.mutateAsync(form);
      setSuccessMessage("Registration successful! You can now log in.");
      setForm({ username: "", email: "", password: "" });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Register to personalize your product discovery experience.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <label className="space-y-2 text-sm">
            <span>Username</span>
            <Input
              required
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Email</span>
            <Input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Password</span>
            <Input
              required
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          </label>
          {successMessage && <p className="text-sm text-emerald-400">{successMessage}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={registerUser.isPending}>
            {registerUser.isPending ? "Submitting..." : "Register"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
