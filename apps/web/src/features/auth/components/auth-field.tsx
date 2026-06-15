import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AuthFieldProps = {
  id: string;
  label: string;
  children: ReactNode;
  description?: ReactNode;
  className?: string;
};

export function AuthField({
  id,
  label,
  children,
  description,
  className,
}: AuthFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {description ? (
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
