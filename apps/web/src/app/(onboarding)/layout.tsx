import type { ReactNode } from "react";

import { AdminShell } from "@/components/layout/admin-shell";
import { RequireOnboardingAuth } from "@/features/auth/components/require-onboarding-auth";

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <RequireOnboardingAuth>
      <AdminShell sidebarNavigation="hidden">{children}</AdminShell>
    </RequireOnboardingAuth>
  );
}
