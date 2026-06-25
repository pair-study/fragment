"use client";

import { createWorkerRequestSchema, type CreateWorkerRequest, type Worker } from "@fragment/shared";
import { useState } from "react";
import { Button } from "@moyeorak/design-system";
import { Plus } from "lucide-react";
import { type FieldErrors, type Resolver, useForm } from "react-hook-form";

import { AdminTableSection } from "@/components/admin/admin-table-section";
import { CrudFormDialog } from "@/components/admin/crud-form-dialog";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { RowActions } from "@/components/common/row-actions";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import {
  useCreateWorkerMutation,
  useDeleteWorkerMutation,
  useUpdateWorkerMutation,
  useWorkersQuery,
} from "@/features/workers/queries/workers-queries";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api-error-message";

type WorkerFormValues = {
  name: string;
  weeklyContractHours: string;
};

const EMPTY_FORM_VALUES: WorkerFormValues = {
  name: "",
  weeklyContractHours: "",
};

function createFormValuesFromWorker(worker: Worker): WorkerFormValues {
  return {
    name: worker.name,
    weeklyContractHours: String(worker.weeklyContractHours),
  };
}

function createWorkerRequestFromForm(values: WorkerFormValues): CreateWorkerRequest {
  return {
    name: values.name.trim(),
    weeklyContractHours: Number(values.weeklyContractHours),
  };
}

const workerFormResolver: Resolver<WorkerFormValues> = (values) => {
  const request = createWorkerRequestFromForm(values);
  const result = createWorkerRequestSchema.safeParse(request);

  if (result.success) {
    return {
      errors: {},
      values,
    };
  }

  const errors: FieldErrors<WorkerFormValues> = {};

  result.error.issues.forEach((issue) => {
    const [field] = issue.path;

    if (field === "name") {
      errors.name = {
        type: "manual",
        message: "이름을 입력하세요.",
      };
      return;
    }

    if (field === "weeklyContractHours") {
      errors.weeklyContractHours = {
        type: "manual",
        message: "주간 계약 시간은 1 이상의 숫자로 입력하세요.",
      };
    }
  });

  return {
    errors,
    values: {},
  };
};

export function MvpWorkersPage() {
  const workersQuery = useWorkersQuery();
  const createWorkerMutation = useCreateWorkerMutation();
  const updateWorkerMutation = useUpdateWorkerMutation();
  const deleteWorkerMutation = useDeleteWorkerMutation();
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<WorkerFormValues>({
    defaultValues: EMPTY_FORM_VALUES,
    resolver: workerFormResolver,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [editingWorkerCode, setEditingWorkerCode] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Worker | null>(null);
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const workers = workersQuery.data?.items ?? [];
  const isEditing = editingWorkerId !== null;
  const formTitle = isEditing ? "근무자 수정" : "근무자 추가";
  const isSaving = createWorkerMutation.isPending || updateWorkerMutation.isPending;
  const tableMessage = workersQuery.isPending
    ? "근무자 목록을 불러오는 중입니다."
    : workersQuery.isError
      ? getApiErrorMessage(
          workersQuery.error,
          "근무자 목록을 불러오지 못했습니다. 다시 시도해 주세요.",
        )
      : "";

  function openCreateForm() {
    setEditingWorkerId(null);
    setEditingWorkerCode("");
    reset(EMPTY_FORM_VALUES);
    setFormError("");
    setFormOpen(true);
  }

  function openEditForm(worker: Worker) {
    setEditingWorkerId(worker.id);
    setEditingWorkerCode(worker.employeeCode);
    reset(createFormValuesFromWorker(worker));
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingWorkerId(null);
    setEditingWorkerCode("");
    reset(EMPTY_FORM_VALUES);
    setFormError("");
  }

  async function saveWorker(values: WorkerFormValues) {
    setFormError("");

    if (isSaving) {
      return;
    }

    const request = createWorkerRequestFromForm(values);

    try {
      if (editingWorkerId) {
        await updateWorkerMutation.mutateAsync({
          request,
          workerId: editingWorkerId,
        });
      } else {
        await createWorkerMutation.mutateAsync(request);
      }

      closeForm();
    } catch (error) {
      setFormError(getApiErrorMessage(error, "근무자를 저장하지 못했습니다. 다시 시도해 주세요."));
    }
  }

  return (
    <AdminPageShell
      title="근무자 관리"
      description="스케줄 추천에 사용할 근무자 기본 정보를 등록하고 관리합니다."
      actions={
        <Button
          type="button"
          variant="brand"
          onClick={openCreateForm}
          disabled={workersQuery.isPending}
        >
          <Plus className="size-4" aria-hidden="true" />
          근무자 추가
        </Button>
      }
      containerClassName="max-w-none"
      contentClassName="space-y-6"
    >
      <AdminTableSection
        title="근무자 목록"
        isEmpty={!workersQuery.isPending && !workersQuery.isError && workers.length === 0}
        emptyTitle="등록된 근무자가 없습니다."
        emptyDescription="근무자를 추가하면 스케줄 추천 대상에 포함됩니다."
      >
        {tableMessage ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">{tableMessage}</div>
        ) : (
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
                    {worker.employeeCode}
                  </td>
                  <td className="px-2 py-4 text-muted-foreground sm:px-4 lg:px-6">
                    주 {worker.weeklyContractHours}시간
                  </td>
                  <td className="px-2 py-4 sm:px-4 lg:px-6">
                    <RowActions
                      onEdit={() => openEditForm(worker)}
                      onDelete={() => {
                        setDeleteError("");
                        setDeleteTarget(worker);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminTableSection>
      {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}

      <CrudFormDialog
        open={formOpen}
        title={formTitle}
        description={
          isEditing
            ? "이름과 주간 계약 시간을 수정할 수 있습니다."
            : "이름과 주간 계약 시간을 입력하면 사번은 자동으로 생성됩니다."
        }
        isSaving={isSaving}
        onClose={closeForm}
        onSave={handleSubmit(saveWorker)}
      >
        <div className="space-y-2">
          <Label htmlFor="worker-name">이름</Label>
          <Input
            id="worker-name"
            placeholder="예: 김민지"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Label htmlFor="employee-code">사번</Label>
            <Input
              id="employee-code"
              value={editingWorkerCode}
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
            placeholder="예: 15"
            aria-invalid={Boolean(errors.weeklyContractHours)}
            {...register("weeklyContractHours")}
          />
          {errors.weeklyContractHours ? (
            <p className="text-sm text-destructive">{errors.weeklyContractHours.message}</p>
          ) : null}
        </div>
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
      </CrudFormDialog>

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="근무자 삭제"
        description="이 근무자를 삭제하면 목록과 추천 대상에서 제외됩니다."
        isDeleting={deleteWorkerMutation.isPending}
        onConfirm={async () => {
          if (!deleteTarget || deleteWorkerMutation.isPending) {
            return;
          }

          setDeleteError("");

          try {
            await deleteWorkerMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          } catch (error) {
            setDeleteTarget(null);
            setDeleteError(
              getApiErrorMessage(error, "근무자를 삭제하지 못했습니다. 다시 시도해 주세요."),
            );
          }
        }}
      />
    </AdminPageShell>
  );
}
