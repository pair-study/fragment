"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getMe } from "@/features/auth/api";

import { useAuth } from "./auth-provider";

type RequireGuestAuthProps = {
  children: ReactNode;
};

export function RequireGuestAuth({ children }: RequireGuestAuthProps) {
  const router = useRouter();
  const { refreshAccessToken } = useAuth();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

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
      } finally {
        if (!ignore) {
          setIsCheckingSession(false);
        }
      }
    }

    redirectIfAuthenticated();

    return () => {
      ignore = true;
    };
  }, [refreshAccessToken, router]);

  if (isCheckingSession) {
    return null;
  }

  return <>{children}</>;
}
