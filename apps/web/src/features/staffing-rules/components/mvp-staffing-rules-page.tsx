"use client";

import type { MinimumStaffingRule } from "@fragment/shared";
import { useMemo, useState } from "react";
import { Button } from "@moyeorak/design-system";
import { Plus } from "lucide-react";

import { AdminTableSection } from "@/components/admin/admin-table-section";
import { CrudFormDialog } from "@/components/admin/crud-form-dialog";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { RowActions } from "@/components/common/row-actions";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import {
  useCreateMinimumStaffingRuleMutation,
  useDeleteMinimumStaffingRuleMutation,
  useMinimumStaffingRulesQuery,
  useUpdateMinimumStaffingRuleMutation,
} from "@/features/staffing-rules/queries/staffing-rules-queries";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api-error-message";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DayOfWeek = MinimumStaffingRule["dayOfWeek"];

type StaffingRuleDraft = {
  dayOfWeek: DayOfWeek | "";
  startTime: string;
  endTime: string;
  requiredCount: string;
};

const DAY_LABELS: Record<DayOfWeek, string> = {
  MON: "월요일",
  TUE: "화요일",
  WED: "수요일",
  THU: "목요일",
  FRI: "금요일",
  SAT: "토요일",
  SUN: "일요일",
};

const EMPTY_DRAFT: StaffingRuleDraft = {
  dayOfWeek: "",
  startTime: "",
  endTime: "",
  requiredCount: "",
};

function createDraftFromRule(rule: MinimumStaffingRule): StaffingRuleDraft {
  return {
    dayOfWeek: rule.dayOfWeek,
    startTime: rule.startTime,
    endTime: rule.endTime,
    requiredCount: String(rule.requiredCount),
  };
}

function validateStaffingRuleDraft(draft: StaffingRuleDraft) {
  const requiredCount = Number(draft.requiredCount);

  return {
    dayOfWeek: !draft.dayOfWeek ? "요일을 선택하세요." : "",
    startTime: !draft.startTime ? "시작 시간을 선택하세요." : "",
    endTime: !draft.endTime
      ? "종료 시간을 선택하세요."
      : draft.startTime && draft.endTime === draft.startTime
        ? "시작 시간과 종료 시간은 같을 수 없습니다."
        : "",
    requiredCount:
      !Number.isFinite(requiredCount) || requiredCount < 1
        ? "최소 인원은 1 이상의 숫자로 입력하세요."
        : "",
  };
}

export function MvpStaffingRulesPage() {
  const staffingRulesQuery = useMinimumStaffingRulesQuery();
  const createMinimumStaffingRuleMutation = useCreateMinimumStaffingRuleMutation();
  const updateMinimumStaffingRuleMutation = useUpdateMinimumStaffingRuleMutation();
  const deleteMinimumStaffingRuleMutation = useDeleteMinimumStaffingRuleMutation();
  const [formOpen, setFormOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MinimumStaffingRule | null>(null);
  const [draft, setDraft] = useState<StaffingRuleDraft>(EMPTY_DRAFT);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const rules = staffingRulesQuery.data?.items ?? [];
  const errors = useMemo(() => validateStaffingRuleDraft(draft), [draft]);
  const hasErrors = Object.values(errors).some(Boolean);
  const isEditing = editingRuleId !== null;
  const formTitle = isEditing ? "조건 수정" : "조건 추가";
  const isSaving =
    createMinimumStaffingRuleMutation.isPending || updateMinimumStaffingRuleMutation.isPending;
  const tableMessage = staffingRulesQuery.isPending
    ? "조건 목록을 불러오는 중입니다."
    : staffingRulesQuery.isError
      ? getApiErrorMessage(
          staffingRulesQuery.error,
          "조건 목록을 불러오지 못했습니다. 다시 시도해 주세요.",
        )
      : "";

  function openCreateForm() {
    setEditingRuleId(null);
    setDraft(EMPTY_DRAFT);
    setSubmitted(false);
    setFormError("");
    setFormOpen(true);
  }

  function openEditForm(rule: MinimumStaffingRule) {
    setEditingRuleId(rule.id);
    setDraft(createDraftFromRule(rule));
    setSubmitted(false);
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setSubmitted(false);
    setEditingRuleId(null);
    setDraft(EMPTY_DRAFT);
    setFormError("");
  }

  async function saveRule() {
    setSubmitted(true);
    setFormError("");

    if (hasErrors || !draft.dayOfWeek || isSaving) {
      return;
    }

    const request = {
      dayOfWeek: draft.dayOfWeek,
      startTime: draft.startTime,
      endTime: draft.endTime,
      endsNextDay: draft.endTime < draft.startTime,
      requiredCount: Number(draft.requiredCount),
    };

    try {
      if (editingRuleId) {
        await updateMinimumStaffingRuleMutation.mutateAsync({
          ruleId: editingRuleId,
          request,
        });
      } else {
        await createMinimumStaffingRuleMutation.mutateAsync(request);
      }

      closeForm();
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, "최소 인원 조건을 저장하지 못했습니다. 다시 시도해 주세요."),
      );
    }
  }

  return (
    <AdminPageShell
      title="최소 인원 조건"
      description="조직 운영에 필요한 요일과 시간대별 최소 근무 인원을 관리합니다."
      actions={
        <Button
          type="button"
          variant="brand"
          onClick={openCreateForm}
          disabled={staffingRulesQuery.isPending}
        >
          <Plus className="size-4" aria-hidden="true" />
          조건 추가
        </Button>
      }
      containerClassName="max-w-none"
      contentClassName="space-y-6"
    >
      <AdminTableSection
        title="조건 목록"
        isEmpty={!staffingRulesQuery.isPending && !staffingRulesQuery.isError && rules.length === 0}
        emptyTitle="등록된 최소 인원 조건이 없습니다."
        emptyDescription="조건을 추가하면 추천 생성 시 해당 시간대의 필요 인원으로 사용됩니다."
      >
        {tableMessage ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">{tableMessage}</div>
        ) : (
          <table className="w-full min-w-max border-collapse text-left text-sm">
            <thead className="bg-surface-secondary text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-2 py-3 sm:px-4 lg:px-6">요일</th>
                <th className="px-2 py-3 sm:px-4 lg:px-6">시작 시간</th>
                <th className="px-2 py-3 sm:px-4 lg:px-6">종료 시간</th>
                <th className="px-2 py-3 sm:px-4 lg:px-6">최소 인원</th>
                <th className="px-2 py-3 text-right sm:px-4 lg:px-6">
                  <span className="sr-only">액션</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rules.map((rule) => (
                <tr key={rule.id} className="bg-card">
                  <td className="px-2 py-4 font-medium text-foreground sm:px-4 lg:px-6">
                    {DAY_LABELS[rule.dayOfWeek]}
                  </td>
                  <td className="px-2 py-4 text-muted-foreground sm:px-4 lg:px-6">
                    {rule.startTime}
                  </td>
                  <td className="px-2 py-4 text-muted-foreground sm:px-4 lg:px-6">
                    {rule.endTime}
                  </td>
                  <td className="px-2 py-4 text-muted-foreground sm:px-4 lg:px-6">
                    {rule.requiredCount}명
                  </td>
                  <td className="px-2 py-4 sm:px-4 lg:px-6">
                    <RowActions
                      onEdit={() => openEditForm(rule)}
                      onDelete={() => {
                        setDeleteError("");
                        setDeleteTarget(rule);
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
        description="특정 요일과 시간대에 필요한 최소 근무 인원을 입력하세요."
        isSaving={isSaving}
        onClose={closeForm}
        onSave={saveRule}
      >
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
            value={draft.requiredCount}
            placeholder="예: 2"
            aria-invalid={submitted && Boolean(errors.requiredCount)}
            onChange={(event) =>
              setDraft((current) => ({ ...current, requiredCount: event.target.value }))
            }
          />
          {submitted && errors.requiredCount ? (
            <p className="text-sm text-destructive">{errors.requiredCount}</p>
          ) : null}
        </div>
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
      </CrudFormDialog>

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="조건 삭제"
        description="이 조건을 삭제하면 추천 생성 시 해당 시간대의 최소 인원 기준에서 제외됩니다."
        isDeleting={deleteMinimumStaffingRuleMutation.isPending}
        onConfirm={async () => {
          if (!deleteTarget || deleteMinimumStaffingRuleMutation.isPending) {
            return;
          }

          setDeleteError("");

          try {
            await deleteMinimumStaffingRuleMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          } catch (error) {
            setDeleteError(
              getApiErrorMessage(
                error,
                "최소 인원 조건을 삭제하지 못했습니다. 다시 시도해 주세요.",
              ),
            );
          }
        }}
      />
    </AdminPageShell>
  );
}
