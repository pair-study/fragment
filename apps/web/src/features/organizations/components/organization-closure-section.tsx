"use client";

import { Calendar, Plus, Tag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ClosureType = "weekly" | "biweekly" | "specific";

export type ClosureRule = {
  id: string;
  type: ClosureType;
  value: string;
  label: string;
};

const dayOptions = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];

type OrganizationClosureSectionProps = {
  rules: ClosureRule[];
  onChange: (rules: ClosureRule[]) => void;
};

export function OrganizationClosureSection({
  rules,
  onChange,
}: OrganizationClosureSectionProps) {
  const addRule = () => {
    onChange([
      ...rules,
      {
        id: crypto.randomUUID(),
        type: "weekly",
        value: "일요일",
        label: "",
      },
    ]);
  };

  const updateRule = (id: string, next: Partial<ClosureRule>) => {
    onChange(
      rules.map((rule) => {
        if (rule.id !== id) return rule;
        const updated = { ...rule, ...next };
        if (next.type === "specific") updated.value = "2026-02-17";
        if (next.type === "weekly" || next.type === "biweekly") {
          updated.value = "일요일";
        }
        return updated;
      }),
    );
  };

  const removeRule = (id: string) => {
    onChange(rules.filter((rule) => rule.id !== id));
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          조직 휴무일{" "}
          <span className="text-sm font-medium text-muted-foreground">선택</span>
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          조직이 쉬는 날이에요. 이 날에는 근무가 배정되지 않아요. 여러 개 설정할 수 있어요.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {rules.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border px-5 py-4 text-sm text-muted-foreground">
            <Calendar className="size-5" aria-hidden="true" />
            설정된 휴무일이 없어요. 필요하면 아래에서 추가하세요.
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="rounded-lg border border-border bg-surface-secondary p-4"
            >
              <div className="grid gap-3 md:grid-cols-[10rem_1fr_auto]">
                <Select
                  value={rule.type}
                  onValueChange={(value) =>
                    updateRule(rule.id, { type: value as ClosureType })
                  }
                >
                  <SelectTrigger aria-label="휴무일 유형">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">매주</SelectItem>
                    <SelectItem value="biweekly">격주</SelectItem>
                    <SelectItem value="specific">특정일</SelectItem>
                  </SelectContent>
                </Select>

                {rule.type === "specific" ? (
                  <Input
                    type="date"
                    value={rule.value}
                    onChange={(event) =>
                      updateRule(rule.id, { value: event.target.value })
                    }
                    aria-label="휴무 날짜"
                  />
                ) : (
                  <Select
                    value={rule.value}
                    onValueChange={(value) => updateRule(rule.id, { value })}
                  >
                    <SelectTrigger aria-label="휴무 요일">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOptions.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="휴무일 삭제"
                  onClick={() => removeRule(rule.id)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>

              <div className="relative mt-3">
                <Tag
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={rule.label}
                  placeholder="라벨 입력"
                  className="pl-9"
                  onChange={(event) =>
                    updateRule(rule.id, { label: event.target.value })
                  }
                />
              </div>
            </div>
          ))
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed text-primary hover:text-primary"
          onClick={addRule}
        >
          <Plus className="size-4" aria-hidden="true" />
          휴무일 추가
        </Button>
      </div>
    </section>
  );
}
