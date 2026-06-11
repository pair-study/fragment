"use client";

import { cn } from "@/lib/utils";

export type WorkType = "fixed" | "flexible" | "both";

const workTypeOptions: Array<{
  value: WorkType;
  title: string;
  description: string;
}> = [
  {
    value: "fixed",
    title: "고정 근무",
    description: "매주 같은 요일·시간에 근무",
  },
  {
    value: "flexible",
    title: "신청 근무",
    description: "근무자가 희망 근무를 신청",
  },
  {
    value: "both",
    title: "둘 다",
    description: "유형을 함께 운영",
  },
];

type WorkTypeFieldProps = {
  value: WorkType | null;
  onChange: (value: WorkType) => void;
};

export function WorkTypeField({ value, onChange }: WorkTypeFieldProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {workTypeOptions.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/60 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected && "border-primary bg-accent text-accent-foreground",
            )}
            onClick={() => onChange(option.value)}
          >
            <span
              className={cn(
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-card",
                selected && "border-primary",
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full bg-transparent",
                  selected && "bg-primary",
                )}
              />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">
                {option.title}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {option.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
