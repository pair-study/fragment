"use client";

import { useMemo, useState } from "react";
import { Button } from "@moyeorak/design-system";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

type StaffingRule = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  minimumWorkers: number;
};

type StaffingRuleDraft = {
  dayOfWeek: DayOfWeek | "";
  startTime: string;
  endTime: string;
  minimumWorkers: string;
};

type StaffingRuleFormMode = "create" | "edit";

const DAY_LABELS: Record<DayOfWeek, string> = {
  MON: "월요일",
  TUE: "화요일",
  WED: "수요일",
  THU: "목요일",
  FRI: "금요일",
  SAT: "토요일",
  SUN: "일요일",
};

const INITIAL_RULES: StaffingRule[] = [
  {
    id: "rule-1",
    dayOfWeek: "MON",
    startTime: "18:00",
    endTime: "22:00",
    minimumWorkers: 2,
  },
  {
    id: "rule-2",
    dayOfWeek: "FRI",
    startTime: "18:00",
    endTime: "22:00",
    minimumWorkers: 3,
  },
  {
    id: "rule-3",
    dayOfWeek: "SAT",
    startTime: "10:00",
    endTime: "16:00",
    minimumWorkers: 2,
  },
];

const EMPTY_DRAFT: StaffingRuleDraft = {
  dayOfWeek: "",
  startTime: "",
  endTime: "",
  minimumWorkers: "",
};

function createDraftFromRule(rule: StaffingRule): StaffingRuleDraft {
  return {
    dayOfWeek: rule.dayOfWeek,
    startTime: rule.startTime,
    endTime: rule.endTime,
    minimumWorkers: String(rule.minimumWorkers),
  };
}

function validateStaffingRuleDraft(draft: StaffingRuleDraft) {
  const minimumWorkers = Number(draft.minimumWorkers);

  return {
    dayOfWeek: !draft.dayOfWeek ? "요일을 선택하세요." : "",
    startTime: !draft.startTime ? "시작 시간을 선택하세요." : "",
    endTime: !draft.endTime
      ? "종료 시간을 선택하세요."
      : draft.startTime && draft.endTime <= draft.startTime
        ? "종료 시간은 시작 시간보다 늦어야 합니다."
        : "",
    minimumWorkers:
      !Number.isFinite(minimumWorkers) || minimumWorkers < 1
        ? "최소 인원은 1 이상의 숫자로 입력하세요."
        : "",
  };
}

export function MvpStaffingRulesPage() {
  const [rules, setRules] = useState<StaffingRule[]>(INITIAL_RULES);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<StaffingRuleFormMode>("create");
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffingRule | null>(null);
  const [draft, setDraft] = useState<StaffingRuleDraft>(EMPTY_DRAFT);
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => validateStaffingRuleDraft(draft), [draft]);
  const hasErrors = Object.values(errors).some(Boolean);
  const formTitle = formMode === "create" ? "조건 추가" : "조건 수정";

  function openCreateForm() {
    setFormMode("create");
    setEditingRuleId(null);
    setDraft(EMPTY_DRAFT);
    setSubmitted(false);
    setFormOpen(true);
  }

  function openEditForm(rule: StaffingRule) {
    setFormMode("edit");
    setEditingRuleId(rule.id);
    setDraft(createDraftFromRule(rule));
    setSubmitted(false);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setSubmitted(false);
    setEditingRuleId(null);
    setDraft(EMPTY_DRAFT);
  }

  function saveRule() {
    setSubmitted(true);

    if (hasErrors || !draft.dayOfWeek) {
      return;
    }

    const dayOfWeek = draft.dayOfWeek;

    if (formMode === "create") {
      setRules((currentRules) => [
        ...currentRules,
        {
          id: `rule-${Date.now()}`,
          dayOfWeek,
          startTime: draft.startTime,
          endTime: draft.endTime,
          minimumWorkers: Number(draft.minimumWorkers),
        },
      ]);
    } else if (editingRuleId) {
      setRules((currentRules) =>
        currentRules.map((rule) =>
          rule.id === editingRuleId
            ? {
                ...rule,
                dayOfWeek,
                startTime: draft.startTime,
                endTime: draft.endTime,
                minimumWorkers: Number(draft.minimumWorkers),
              }
            : rule,
        ),
      );
    }

    closeForm();
  }

  return (
    <AdminPageShell
      title="최소 인원 조건"
      description="매장 운영에 필요한 요일과 시간대별 최소 근무 인원을 관리합니다."
      actions={
        <Button type="button" variant="brand" onClick={openCreateForm}>
          <Plus className="size-4" aria-hidden="true" />
          조건 추가
        </Button>
      }
      containerClassName="max-w-none"
      contentClassName="space-y-6"
    >
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">조건 목록</h2>
        </div>

        {rules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-2xl border-collapse text-left text-sm">
              <thead className="bg-surface-secondary text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">요일</th>
                  <th className="px-6 py-3">시작 시간</th>
                  <th className="px-6 py-3">종료 시간</th>
                  <th className="px-6 py-3">최소 인원</th>
                  <th className="px-6 py-3 text-right">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rules.map((rule) => (
                  <tr key={rule.id} className="bg-card">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {DAY_LABELS[rule.dayOfWeek]}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{rule.startTime}</td>
                    <td className="px-6 py-4 text-muted-foreground">{rule.endTime}</td>
                    <td className="px-6 py-4 text-muted-foreground">{rule.minimumWorkers}명</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => openEditForm(rule)}>
                          <Pencil className="size-4" aria-hidden="true" />
                          수정
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDeleteTarget(rule)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-foreground">등록된 최소 인원 조건이 없습니다.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              조건을 추가하면 추천 생성 시 해당 시간대의 필요 인원으로 사용됩니다.
            </p>
          </div>
        )}
      </section>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="staffing-rule-form-title"
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-modal"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="staffing-rule-form-title" className="text-lg font-semibold text-foreground">
                  {formTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  특정 요일과 시간대에 필요한 최소 근무 인원을 입력하세요.
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="닫기"
                onClick={closeForm}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="staffing-rule-day">요일</Label>
                <Select
                  value={draft.dayOfWeek}
                  onValueChange={(value) =>
                    setDraft((current) => ({ ...current, dayOfWeek: value as DayOfWeek }))
                  }
                >
                  <SelectTrigger
                    id="staffing-rule-day"
                    aria-invalid={submitted && Boolean(errors.dayOfWeek)}
                  >
                    <SelectValue placeholder="요일을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DAY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {submitted && errors.dayOfWeek ? (
                  <p className="text-sm text-destructive">{errors.dayOfWeek}</p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="staffing-rule-start-time">시작 시간</Label>
                  <Input
                    id="staffing-rule-start-time"
                    type="time"
                    value={draft.startTime}
                    aria-invalid={submitted && Boolean(errors.startTime)}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, startTime: event.target.value }))
                    }
                  />
                  {submitted && errors.startTime ? (
                    <p className="text-sm text-destructive">{errors.startTime}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staffing-rule-end-time">종료 시간</Label>
                  <Input
                    id="staffing-rule-end-time"
                    type="time"
                    value={draft.endTime}
                    aria-invalid={submitted && Boolean(errors.endTime)}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, endTime: event.target.value }))
                    }
                  />
                  {submitted && errors.endTime ? (
                    <p className="text-sm text-destructive">{errors.endTime}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum-workers">최소 인원</Label>
                <Input
                  id="minimum-workers"
                  type="number"
                  min={1}
                  value={draft.minimumWorkers}
                  placeholder="예: 2"
                  aria-invalid={submitted && Boolean(errors.minimumWorkers)}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, minimumWorkers: event.target.value }))
                  }
                />
                {submitted && errors.minimumWorkers ? (
                  <p className="text-sm text-destructive">{errors.minimumWorkers}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeForm}>
                취소
              </Button>
              <Button type="button" variant="brand" onClick={saveRule}>
                저장
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>조건 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 조건을 삭제하면 추천 생성 시 해당 시간대의 최소 인원 기준에서 제외됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteTarget) {
                  return;
                }

                setRules((currentRules) =>
                  currentRules.filter((rule) => rule.id !== deleteTarget.id),
                );
                setDeleteTarget(null);
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
