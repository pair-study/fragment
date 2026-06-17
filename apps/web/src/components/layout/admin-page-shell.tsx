import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  contentClassName?: string;
  descriptionClassName?: string;
};

export function AdminPageShell({
  title,
  description,
  children,
  contentClassName,
  descriptionClassName,
}: AdminPageShellProps) {
  return (
    <main className="min-h-full bg-background px-6 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8">
          <h1 className="text-balance text-3xl font-bold text-foreground">{title}</h1>
          <p
            className={cn(
              "mt-3 text-pretty text-sm leading-6 text-muted-foreground",
              descriptionClassName,
            )}
          >
            {description}
          </p>
        </header>
        <div className={cn(contentClassName)}>{children}</div>
      </div>
    </main>
  );
}
