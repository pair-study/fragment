"use client";

import { useMemo, useState } from "react";
import { Button } from "@moyeorak/design-system";
import { Plus } from "lucide-react";

import { AdminTableSection } from "@/components/admin/admin-table-section";
import { CrudFormDialog } from "@/components/admin/crud-form-dialog";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { RowActions } from "@/components/common/row-actions";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
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
    weeklyContractHours:
      !Number.isFinite(weeklyHours) || weeklyHours < 1
        ? "주간 계약 시간은 1 이상의 숫자로 입력하세요."
        : "",
  };
}

function createNextEmployeeNumber(workers: Worker[]) {
  const nextNumber = workers.length + 1;
  return `A${String(nextNumber).padStart(3, "0")}`;
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
          employeeNumber: createNextEmployeeNumber(currentWorkers),
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
      <AdminTableSection
        title="근무자 목록"
        isEmpty={workers.length === 0}
        emptyTitle="등록된 근무자가 없습니다."
        emptyDescription="근무자를 추가하면 스케줄 추천 대상에 포함됩니다."
      >
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <thead className="bg-surface-secondary text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="px-2 py-3 sm:px-4 lg:px-6">이름</th>
              <th className="px-2 py-3 sm:px-4 lg:px-6">사번</th>
              <th className="px-2 py-3 sm:px-4 lg:px-6">주간 계약 시간</th>
              <th className="px-2 py-3 text-right sm:px-4 lg:px-6">
                <span className="sr-only">액션</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {workers.map((worker) => (
              <tr key={worker.id} className="bg-card">
                <td className="px-2 py-4 font-medium text-foreground sm:px-4 lg:px-6">
                  {worker.name}
                </td>
                <td className="px-2 py-4 text-muted-foreground sm:px-4 lg:px-6">
                  {worker.employeeNumber}
                </td>
                <td className="px-2 py-4 text-muted-foreground sm:px-4 lg:px-6">
                  주 {worker.weeklyContractHours}시간
                </td>
                <td className="px-2 py-4 sm:px-4 lg:px-6">
                  <RowActions
                    onEdit={() => openEditForm(worker)}
                    onDelete={() => setDeleteTarget(worker)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableSection>

      <CrudFormDialog
        open={formOpen}
        title={formTitle}
        description={
          formMode === "create"
            ? "이름과 주간 계약 시간을 입력하면 사번은 자동으로 생성됩니다."
            : "이름과 주간 계약 시간을 수정할 수 있습니다."
        }
        onClose={closeForm}
        onSave={saveWorker}
      >
        <div className="space-y-2">
          <Label htmlFor="worker-name">이름</Label>
          <Input
            id="worker-name"
            value={draft.name}
            placeholder="예: 김민지"
            aria-invalid={submitted && Boolean(errors.name)}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          />
          {submitted && errors.name ? (
            <p className="text-sm text-destructive">{errors.name}</p>
          ) : null}
        </div>

        {formMode === "edit" ? (
          <div className="space-y-2">
            <Label htmlFor="employee-number">사번</Label>
            <Input
              id="employee-number"
              value={draft.employeeNumber}
              readOnly
              className="bg-surface-secondary"
            />
          </div>
        ) : null}

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
      </CrudFormDialog>

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="근무자 삭제"
        description="이 근무자를 삭제하면 목록과 추천 대상에서 제외됩니다."
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }

          setWorkers((currentWorkers) =>
            currentWorkers.filter((worker) => worker.id !== deleteTarget.id),
          );
          setDeleteTarget(null);
        }}
      />
    </AdminPageShell>
  );
}
