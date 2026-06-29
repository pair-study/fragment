import type { ReactNode } from "react";

import { RequireGuestAuth } from "@/features/auth/components/require-guest-auth";

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <RequireGuestAuth>{children}</RequireGuestAuth>;
}
