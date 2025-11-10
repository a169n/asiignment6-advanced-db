"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-context";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const { user, logout } = useAuth();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    const next = params.toString();
    router.push(next ? `/?${next}` : "/");
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const links = user
    ? [
        { href: "/", label: "Catalog" },
        { href: "/profile", label: "Profile" }
      ]
    : [
        { href: "/login", label: "Login" },
        { href: "/register", label: "Register" }
      ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-white">
          Advanced DB Commerce
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white",
                pathname === link.href && "bg-slate-800 text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {user ? (
          <form className="ml-auto flex w-full max-w-sm items-center gap-2" onSubmit={onSubmit}>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products"
            />
            <Button type="submit">Search</Button>
          </form>
        ) : (
          <div className="ml-auto text-sm text-slate-400">Log in to explore the catalog.</div>
        )}
        {user && (
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span className="hidden sm:inline">Hello, {user.username}</span>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
