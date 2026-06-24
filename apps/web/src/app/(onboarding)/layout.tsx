import type { ReactNode } from "react";

import { RequireOnboardingAuth } from "@/features/auth/components/require-onboarding-auth";

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <RequireOnboardingAuth>
      <div className="min-h-dvh bg-background">{children}</div>
    </RequireOnboardingAuth>
  );
}
