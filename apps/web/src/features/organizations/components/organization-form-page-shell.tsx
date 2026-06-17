import type { ReactNode } from "react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";

type OrganizationFormPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function OrganizationFormPageShell({
  title,
  description,
  children,
}: OrganizationFormPageShellProps) {
  return (
    <AdminPageShell title={title} description={description}>
      {children}
    </AdminPageShell>
  );
}
