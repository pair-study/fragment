import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

type PasswordRuleListProps = {
  password: string;
  className?: string;
};

export function PasswordRuleList({
  password,
  className,
}: PasswordRuleListProps) {
  const rules = [
    {
      label: "8자 이상",
      met: password.length >= 8,
    },
    {
      label: "영문과 숫자 포함",
      met: /[a-zA-Z]/.test(password) && /[0-9]/.test(password),
    },
  ];

  return (
    <ul className={cn("space-y-1.5", className)}>
      {rules.map((rule) => (
        <li
          key={rule.label}
          className={cn(
            "flex items-center gap-2 text-xs font-medium",
            rule.met ? "text-status-confirmed" : "text-muted-foreground",
          )}
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {rule.label}
        </li>
      ))}
    </ul>
  );
}
