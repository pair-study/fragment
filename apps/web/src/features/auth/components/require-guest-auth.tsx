"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getMe } from "@/features/auth/api";

import { useAuth } from "./auth-provider";

type RequireGuestAuthProps = {
  children: ReactNode;
};

export function RequireGuestAuth({ children }: RequireGuestAuthProps) {
  const router = useRouter();
  const { refreshAccessToken } = useAuth();

  useEffect(() => {
    let ignore = false;

    async function redirectIfAuthenticated() {
      try {
        await refreshAccessToken();
        const authMe = await getMe({ redirectOnUnauthorized: false });

        if (!ignore) {
          router.replace(authMe.organization ? "/dashboard" : "/organization/new");
        }
      } catch {
        // Guest routes should stay usable when no session can be restored.
      }
    }

    redirectIfAuthenticated();

    return () => {
      ignore = true;
    };
  }, [refreshAccessToken, router]);

  return <>{children}</>;
}
