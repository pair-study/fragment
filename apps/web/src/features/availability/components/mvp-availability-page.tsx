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

type Worker = {
  id: string;
  name: string;
  weeklyContractHours: number;
};

type Availability = {
  id: string;
  workerId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
};

type AvailabilityDraft = {
  dayOfWeek: DayOfWeek | "";
  startTime: string;
  endTime: string;
};

type AvailabilityFormMode = "create" | "edit";

type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

const WORKERS: Worker[] = [
  { id: "worker-1", name: "김민지", weeklyContractHours: 15 },
  { id: "worker-2", name: "박준호", weeklyContractHours: 20 },
  { id: "worker-3", name: "이서연", weeklyContractHours: 12 },
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  MON: "월요일",
  TUE: "화요일",
  WED: "수요일",
  THU: "목요일",
  FRI: "금요일",
  SAT: "토요일",
  SUN: "일요일",
};

const INITIAL_AVAILABILITY: Availability[] = [
  {
    id: "availability-1",
    workerId: "worker-1",
    dayOfWeek: "MON",
    startTime: "18:00",
    endTime: "22:00",
  },
  {
    id: "availability-2",
    workerId: "worker-1",
    dayOfWeek: "WED",
    startTime: "18:00",
    endTime: "22:00",
  },
  {
    id: "availability-3",
    workerId: "worker-2",
    dayOfWeek: "FRI",
    startTime: "14:00",
    endTime: "22:00",
  },
];

const EMPTY_DRAFT: AvailabilityDraft = {
  dayOfWeek: "",
  startTime: "",
  endTime: "",
};

function createDraftFromAvailability(availability: Availability): AvailabilityDraft {
  return {
    dayOfWeek: availability.dayOfWeek,
    startTime: availability.startTime,
    endTime: availability.endTime,
  };
}

function validateAvailabilityDraft(draft: AvailabilityDraft) {
  return {
    dayOfWeek: !draft.dayOfWeek ? "요일을 선택하세요." : "",
    startTime: !draft.startTime ? "시작 시간을 선택하세요." : "",
    endTime: !draft.endTime
      ? "종료 시간을 선택하세요."
      : draft.startTime && draft.endTime <= draft.startTime
        ? "종료 시간은 시작 시간보다 늦어야 합니다."
        : "",
  };
}

export function MvpAvailabilityPage() {
  const [selectedWorkerId, setSelectedWorkerId] = useState(WORKERS[0]?.id ?? "");
  const [availability, setAvailability] = useState<Availability[]>(INITIAL_AVAILABILITY);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<AvailabilityFormMode>("create");
  const [editingAvailabilityId, setEditingAvailabilityId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Availability | null>(null);
  const [draft, setDraft] = useState<AvailabilityDraft>(EMPTY_DRAFT);
  const [submitted, setSubmitted] = useState(false);

  const selectedWorker = WORKERS.find((worker) => worker.id === selectedWorkerId) ?? WORKERS[0];
  const selectedAvailability = availability.filter((item) => item.workerId === selectedWorkerId);
  const errors = useMemo(() => validateAvailabilityDraft(draft), [draft]);
  const hasErrors = Object.values(errors).some(Boolean);
  const formTitle = formMode === "create" ? "가능 시간 추가" : "가능 시간 수정";

  function openCreateForm() {
    setFormMode("create");
    setEditingAvailabilityId(null);
    setDraft(EMPTY_DRAFT);
    setSubmitted(false);
    setFormOpen(true);
  }

  function openEditForm(item: Availability) {
    setFormMode("edit");
    setEditingAvailabilityId(item.id);
    setDraft(createDraftFromAvailability(item));
    setSubmitted(false);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setSubmitted(false);
    setEditingAvailabilityId(null);
    setDraft(EMPTY_DRAFT);
  }

  function saveAvailability() {
    setSubmitted(true);

    if (hasErrors || !draft.dayOfWeek) {
      return;
    }

    const dayOfWeek = draft.dayOfWeek;

    if (formMode === "create") {
      setAvailability((currentAvailability) => [
        ...currentAvailability,
        {
          id: `availability-${Date.now()}`,
          workerId: selectedWorkerId,
          dayOfWeek,
          startTime: draft.startTime,
          endTime: draft.endTime,
        },
      ]);
    } else if (editingAvailabilityId) {
      setAvailability((currentAvailability) =>
        currentAvailability.map((item) =>
          item.id === editingAvailabilityId && draft.dayOfWeek
            ? {
                ...item,
                dayOfWeek,
                startTime: draft.startTime,
                endTime: draft.endTime,
              }
            : item,
        ),
      );
    }

    closeForm();
  }

  return (
    <AdminPageShell
      title="가능 시간 관리"
      description="근무자별로 일할 수 있는 요일과 시간대를 등록하고 관리합니다."
      actions={
        <Button type="button" variant="brand" onClick={openCreateForm}>
          <Plus className="size-4" aria-hidden="true" />
          가능 시간 추가
        </Button>
      }
      containerClassName="max-w-none"
      contentClassName="space-y-6"
    >
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="grid gap-5 lg:grid-cols-[minmax(240px,360px)_1fr] lg:items-end">
          <div className="space-y-2">
            <Label htmlFor="worker-select">근무자 선택</Label>
            <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
              <SelectTrigger id="worker-select">
                <SelectValue placeholder="근무자를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {WORKERS.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-surface-secondary px-4 py-3">
            <p className="text-sm font-semibold text-foreground">{selectedWorker.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              주간 계약 시간: 주 {selectedWorker.weeklyContractHours}시간
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">가능 시간 목록</h2>
        </div>

        {selectedAvailability.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-2xl border-collapse text-left text-sm">
              <thead className="bg-surface-secondary text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">요일</th>
                  <th className="px-6 py-3">시작 시간</th>
                  <th className="px-6 py-3">종료 시간</th>
                  <th className="px-6 py-3 text-right">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {selectedAvailability.map((item) => (
                  <tr key={item.id} className="bg-card">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {DAY_LABELS[item.dayOfWeek]}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{item.startTime}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.endTime}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => openEditForm(item)}>
                          <Pencil className="size-4" aria-hidden="true" />
                          수정
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDeleteTarget(item)}
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
            <p className="text-sm font-medium text-foreground">등록된 가능 시간이 없습니다.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              선택한 근무자가 일할 수 있는 시간을 추가하세요.
            </p>
          </div>
        )}
      </section>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="availability-form-title"
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-modal"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="availability-form-title" className="text-lg font-semibold text-foreground">
                  {formTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {selectedWorker.name} 근무자가 일할 수 있는 시간을 입력하세요.
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
                <Label htmlFor="day-of-week">요일</Label>
                <Select
                  value={draft.dayOfWeek}
                  onValueChange={(value) =>
                    setDraft((current) => ({ ...current, dayOfWeek: value as DayOfWeek }))
                  }
                >
                  <SelectTrigger
                    id="day-of-week"
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
                  <Label htmlFor="availability-start-time">시작 시간</Label>
                  <Input
                    id="availability-start-time"
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
                  <Label htmlFor="availability-end-time">종료 시간</Label>
                  <Input
                    id="availability-end-time"
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
            </div>

            <div className="mt-8 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeForm}>
                취소
              </Button>
              <Button type="button" variant="brand" onClick={saveAvailability}>
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
            <AlertDialogTitle>가능 시간 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 가능 시간을 삭제하면 추천 생성 시 해당 시간대에 배정되지 않습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteTarget) {
                  return;
                }

                setAvailability((currentAvailability) =>
                  currentAvailability.filter((item) => item.id !== deleteTarget.id),
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
