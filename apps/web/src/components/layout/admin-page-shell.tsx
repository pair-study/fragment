import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
  containerClassName?: string;
  contentClassName?: string;
  descriptionClassName?: string;
};

export function AdminPageShell({
  title,
  description,
  children,
  actions,
  containerClassName,
  contentClassName,
  descriptionClassName,
}: AdminPageShellProps) {
  return (
    <main className="min-h-full bg-background px-6 py-10">
      <div className={cn("mx-auto w-full max-w-5xl", containerClassName)}>
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-balance text-3xl font-bold text-foreground">{title}</h1>
            <p
              className={cn(
                "mt-3 text-pretty text-sm leading-6 text-muted-foreground",
                descriptionClassName,
              )}
            >
              {description}
            </p>
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </header>
        <div className={cn(contentClassName)}>{children}</div>
      </div>
    </main>
  );
}
