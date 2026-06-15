import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AuthPageShellProps = {
  children: ReactNode;
  className?: string;
};

export function AuthPageShell({ children, className }: AuthPageShellProps) {
  return (
    <main
      className={cn(
        "flex min-h-dvh items-center justify-center bg-background px-6 py-10",
        className,
      )}
    >
      {children}
    </main>
  );
}
