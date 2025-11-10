"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-context";

export function UserRegistrationForm() {
  const router = useRouter();
  const { register, authenticating } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);
    try {
      await register(form);
      setMessage("Registration successful! Redirecting to your dashboard...");
      router.replace("/");
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Registration failed");
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
          {message && <p className="text-sm text-emerald-400">{message}</p>}
          {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={authenticating}>
            {authenticating ? "Submitting..." : "Register"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
