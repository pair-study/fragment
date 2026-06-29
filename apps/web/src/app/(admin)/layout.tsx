import type { ReactNode } from "react";

import { AdminShell } from "@/components/layout/admin-shell";
import { RequireAdminAuth } from "@/features/auth/components/require-admin-auth";

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <RequireAdminAuth>
      <AdminShell>{children}</AdminShell>
    </RequireAdminAuth>
  );
}
