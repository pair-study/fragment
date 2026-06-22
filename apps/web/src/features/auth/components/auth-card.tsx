import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { AuthBrand } from "./auth-brand";

type AuthCardProps = {
  children: ReactNode;
  className?: string;
};

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <Card className={cn("w-full max-w-lg", className)}>
      <CardContent className="p-8 sm:p-10">
        <AuthBrand className="mb-8 lg:hidden" />
        {children}
      </CardContent>
    </Card>
  );
}
