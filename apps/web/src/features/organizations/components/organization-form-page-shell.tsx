import type { ReactNode } from "react";

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
    <main className="min-h-full bg-background px-6 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8">
          <h1 className="text-balance text-3xl font-bold text-foreground">{title}</h1>
          <p className="mt-3 text-pretty text-sm leading-6 text-muted-foreground">{description}</p>
        </header>
        {children}
      </div>
    </main>
  );
}
