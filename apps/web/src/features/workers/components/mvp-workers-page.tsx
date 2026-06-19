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

type Worker = {
  id: string;
  name: string;
  employeeNumber: string;
  weeklyContractHours: number;
};

type WorkerDraft = {
  name: string;
  employeeNumber: string;
  weeklyContractHours: string;
};

type WorkerFormMode = "create" | "edit";

const INITIAL_WORKERS: Worker[] = [
  { id: "worker-1", name: "김민지", employeeNumber: "A001", weeklyContractHours: 15 },
  { id: "worker-2", name: "박준호", employeeNumber: "A002", weeklyContractHours: 20 },
  { id: "worker-3", name: "이서연", employeeNumber: "A003", weeklyContractHours: 12 },
];

const EMPTY_DRAFT: WorkerDraft = {
  name: "",
  employeeNumber: "",
  weeklyContractHours: "",
};

function createDraftFromWorker(worker: Worker): WorkerDraft {
  return {
    name: worker.name,
    employeeNumber: worker.employeeNumber,
    weeklyContractHours: String(worker.weeklyContractHours),
  };
}

function validateWorkerDraft(draft: WorkerDraft) {
  const weeklyHours = Number(draft.weeklyContractHours);

  return {
    name: !draft.name.trim() ? "이름을 입력하세요." : "",
    employeeNumber: !draft.employeeNumber.trim() ? "사번을 입력하세요." : "",
    weeklyContractHours:
      !Number.isFinite(weeklyHours) || weeklyHours < 1
        ? "주간 계약 시간은 1 이상의 숫자로 입력하세요."
        : "",
  };
}

export function MvpWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<WorkerFormMode>("create");
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Worker | null>(null);
  const [draft, setDraft] = useState<WorkerDraft>(EMPTY_DRAFT);
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => validateWorkerDraft(draft), [draft]);
  const hasErrors = Object.values(errors).some(Boolean);
  const formTitle = formMode === "create" ? "근무자 추가" : "근무자 수정";

  function openCreateForm() {
    setFormMode("create");
    setEditingWorkerId(null);
    setDraft(EMPTY_DRAFT);
    setSubmitted(false);
    setFormOpen(true);
  }

  function openEditForm(worker: Worker) {
    setFormMode("edit");
    setEditingWorkerId(worker.id);
    setDraft(createDraftFromWorker(worker));
    setSubmitted(false);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setSubmitted(false);
    setEditingWorkerId(null);
    setDraft(EMPTY_DRAFT);
  }

  function saveWorker() {
    setSubmitted(true);

    if (hasErrors) {
      return;
    }

    if (formMode === "create") {
      setWorkers((currentWorkers) => [
        ...currentWorkers,
        {
          id: `worker-${Date.now()}`,
          name: draft.name.trim(),
          employeeNumber: draft.employeeNumber.trim(),
          weeklyContractHours: Number(draft.weeklyContractHours),
        },
      ]);
    } else if (editingWorkerId) {
      setWorkers((currentWorkers) =>
        currentWorkers.map((worker) =>
          worker.id === editingWorkerId
            ? {
                ...worker,
                name: draft.name.trim(),
                employeeNumber: draft.employeeNumber.trim(),
                weeklyContractHours: Number(draft.weeklyContractHours),
              }
            : worker,
        ),
      );
    }

    closeForm();
  }

  return (
    <AdminPageShell
      title="근무자 관리"
      description="스케줄 추천에 사용할 근무자 기본 정보를 등록하고 관리합니다."
      actions={
        <Button type="button" variant="brand" onClick={openCreateForm}>
          <Plus className="size-4" aria-hidden="true" />
          근무자 추가
        </Button>
      }
      containerClassName="max-w-none"
      contentClassName="space-y-6"
    >
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">근무자 목록</h2>
        </div>

        {workers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-2xl border-collapse text-left text-sm">
              <thead className="bg-surface-secondary text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">이름</th>
                  <th className="px-6 py-3">사번</th>
                  <th className="px-6 py-3">주간 계약 시간</th>
                  <th className="px-6 py-3 text-right">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workers.map((worker) => (
                  <tr key={worker.id} className="bg-card">
                    <td className="px-6 py-4 font-medium text-foreground">{worker.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{worker.employeeNumber}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      주 {worker.weeklyContractHours}시간
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => openEditForm(worker)}>
                          <Pencil className="size-4" aria-hidden="true" />
                          수정
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDeleteTarget(worker)}
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
            <p className="text-sm font-medium text-foreground">등록된 근무자가 없습니다.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              근무자를 추가하면 스케줄 추천 대상에 포함됩니다.
            </p>
          </div>
        )}
      </section>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="worker-form-title"
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-modal"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="worker-form-title" className="text-lg font-semibold text-foreground">
                  {formTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  이름, 사번, 주간 계약 시간을 입력하세요.
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
                <Label htmlFor="worker-name">이름</Label>
                <Input
                  id="worker-name"
                  value={draft.name}
                  placeholder="예: 김민지"
                  aria-invalid={submitted && Boolean(errors.name)}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, name: event.target.value }))
                  }
                />
                {submitted && errors.name ? (
                  <p className="text-sm text-destructive">{errors.name}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee-number">사번</Label>
                <Input
                  id="employee-number"
                  value={draft.employeeNumber}
                  placeholder="예: A001"
                  aria-invalid={submitted && Boolean(errors.employeeNumber)}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, employeeNumber: event.target.value }))
                  }
                />
                {submitted && errors.employeeNumber ? (
                  <p className="text-sm text-destructive">{errors.employeeNumber}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weekly-contract-hours">주간 계약 시간</Label>
                <Input
                  id="weekly-contract-hours"
                  type="number"
                  min={1}
                  value={draft.weeklyContractHours}
                  placeholder="예: 15"
                  aria-invalid={submitted && Boolean(errors.weeklyContractHours)}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      weeklyContractHours: event.target.value,
                    }))
                  }
                />
                {submitted && errors.weeklyContractHours ? (
                  <p className="text-sm text-destructive">{errors.weeklyContractHours}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeForm}>
                취소
              </Button>
              <Button type="button" variant="brand" onClick={saveWorker}>
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
            <AlertDialogTitle>근무자 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 근무자를 삭제하면 목록과 추천 대상에서 제외됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteTarget) {
                  return;
                }

                setWorkers((currentWorkers) =>
                  currentWorkers.filter((worker) => worker.id !== deleteTarget.id),
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
