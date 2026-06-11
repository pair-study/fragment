import { cn } from "@/lib/utils";

type AuthBrandProps = {
  className?: string;
};

export function AuthBrand({ className }: AuthBrandProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground shadow-sm">
          일
        </span>
        <span className="text-lg font-bold text-foreground">일감</span>
      </div>
      <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
        관리자
      </span>
    </div>
  );
}
