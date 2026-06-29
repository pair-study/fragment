import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { AuthBrand } from "./auth-brand";

type AuthPageShellProps = {
  children: ReactNode;
  className?: string;
};

export function AuthPageShell({ children, className }: AuthPageShellProps) {
  return (
    <main className={cn("grid min-h-dvh bg-background lg:grid-cols-2", className)}>
      <section className="hidden min-h-dvh items-center justify-center bg-primary px-10 py-12 text-primary-foreground lg:flex">
        <AuthBrand variant="hero" />
      </section>
      <section className="flex min-h-dvh items-center justify-center px-6 py-10">
        {children}
      </section>
    </main>
  );
}
