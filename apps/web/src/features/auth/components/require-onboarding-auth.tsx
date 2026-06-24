"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthMeQuery } from "@/features/auth/queries/auth-session";

type RequireOnboardingAuthProps = {
  children: ReactNode;
};

export function RequireOnboardingAuth({ children }: RequireOnboardingAuthProps) {
  const router = useRouter();
  const { data, isError, isPending } = useAuthMeQuery();

  useEffect(() => {
    if (isError) {
      router.replace("/login");
      return;
    }

    if (data?.organization) {
      router.replace("/dashboard");
    }
  }, [data, isError, router]);

  if (isPending || isError || data?.organization) {
    return <AuthRouteLoading />;
  }

  return <>{children}</>;
}

function AuthRouteLoading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6">
      <p className="text-sm text-muted-foreground">인증 상태를 확인하고 있습니다.</p>
    </main>
  );
}
