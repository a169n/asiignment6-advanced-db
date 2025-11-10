"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";

export function useAuthGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (loading) return;
    if (user) return;

    const search = searchParams.toString();
    const redirectTarget = `${pathname}${search ? `?${search}` : ""}`;
    const params = new URLSearchParams();
    params.set("redirect", redirectTarget);
    router.replace(`/login?${params.toString()}`);
  }, [user, loading, router, pathname, searchParams]);

  return { user, loading };
}
