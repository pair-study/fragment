import type { ReactNode } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { cn } from "@/lib/utils";

type AdminTableSectionProps = {
  title: string;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  children: ReactNode;
  tableContainerClassName?: string;
};

export function AdminTableSection({
  title,
  isEmpty,
  emptyTitle,
  emptyDescription,
  children,
  tableContainerClassName,
}: AdminTableSectionProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>

      {isEmpty ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className={cn("overflow-x-auto", tableContainerClassName)}>{children}</div>
      )}
    </section>
  );
}
