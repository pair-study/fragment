"use client";

import {
  createMinimumStaffingRuleRequestSchema,
  type CreateMinimumStaffingRuleRequest,
  type MinimumStaffingRule,
  type OrganizationDetail,
} from "@fragment/shared";
import { useMemo, useState } from "react";
import { Button } from "@moyeorak/design-system";
import { Plus } from "lucide-react";
import { Controller, type FieldErrors, type Resolver, useForm } from "react-hook-form";

import { AdminTableSection } from "@/components/admin/admin-table-section";
import { CrudFormDialog } from "@/components/admin/crud-form-dialog";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { RowActions } from "@/components/common/row-actions";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { useOrganizationQuery } from "@/features/organization/queries/organization-queries";
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
type BusinessHour = OrganizationDetail["businessHours"][number];

type StaffingRuleFormValues = {
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

const EMPTY_FORM_VALUES: StaffingRuleFormValues = {
  dayOfWeek: "",
  startTime: "",
  endTime: "",
  requiredCount: "",
};

const MINUTES_IN_DAY = 24 * 60;
const TIME_OPTION_STEP_MINUTES = 30;

function createFormValuesFromRule(rule: MinimumStaffingRule): StaffingRuleFormValues {
  return {
    dayOfWeek: rule.dayOfWeek,
    startTime: rule.startTime,
    endTime: rule.endTime,
    requiredCount: String(rule.requiredCount),
  };
}

function parseTimeToMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);

  return hour * 60 + minute;
}

function minutesToTime(minutes: number) {
  const minutesInDay = minutes % MINUTES_IN_DAY;
  const hour = Math.floor(minutesInDay / 60);
  const minute = minutesInDay % 60;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getBusinessHourForDay(businessHours: BusinessHour[], dayOfWeek: DayOfWeek | "") {
  if (!dayOfWeek) {
    return undefined;
  }

  return businessHours.find((businessHour) => businessHour.dayOfWeek === dayOfWeek);
}

function isSelectableBusinessHour(businessHour: BusinessHour | undefined) {
  return Boolean(
    businessHour && !businessHour.isClosed && businessHour.openTime && businessHour.closeTime,
  );
}

function getBusinessHourEndMinutes(businessHour: BusinessHour) {
  const closeMinutes = parseTimeToMinutes(businessHour.closeTime ?? "00:00");

  return businessHour.closesNextDay ? closeMinutes + MINUTES_IN_DAY : closeMinutes;
}

function createTimeOptions(
  businessHour: BusinessHour | undefined,
  boundary: "start" | "end",
): { label: string; value: string }[] {
  if (!isSelectableBusinessHour(businessHour) || !businessHour?.openTime) {
    return [];
  }

  const startMinutes = parseTimeToMinutes(businessHour.openTime);
  const endMinutes = getBusinessHourEndMinutes(businessHour);
  const firstMinutes =
    boundary === "start" ? startMinutes : startMinutes + TIME_OPTION_STEP_MINUTES;
  const lastMinutes = boundary === "start" ? endMinutes - TIME_OPTION_STEP_MINUTES : endMinutes;
  const options: { label: string; value: string }[] = [];

  for (let minutes = firstMinutes; minutes <= lastMinutes; minutes += TIME_OPTION_STEP_MINUTES) {
    const value = minutesToTime(minutes);
    const label = minutes >= MINUTES_IN_DAY ? `${value} 다음날` : value;

    options.push({ label, value });
  }

  return options;
}

function getBusinessHourLabel(businessHour: BusinessHour | undefined) {
  if (!businessHour) {
    return "등록된 운영시간이 없습니다.";
  }

  if (!isSelectableBusinessHour(businessHour)) {
    return "휴무일입니다.";
  }

  return `운영시간: ${businessHour.openTime}-${businessHour.closeTime}${
    businessHour.closesNextDay ? " 다음날" : ""
  }`;
}

function validateRuleBusinessHours(values: StaffingRuleFormValues, businessHours: BusinessHour[]) {
  if (!values.dayOfWeek || !values.startTime || !values.endTime) {
    return null;
  }

  const businessHour = getBusinessHourForDay(businessHours, values.dayOfWeek);

  if (!isSelectableBusinessHour(businessHour) || !businessHour?.openTime) {
    return {
      field: "dayOfWeek" as const,
      message: "휴무일에는 최소 인원 조건을 등록할 수 없습니다.",
    };
  }

  const businessStartMinutes = parseTimeToMinutes(businessHour.openTime);
  const businessEndMinutes = getBusinessHourEndMinutes(businessHour);
  const ruleStartMinutes = parseTimeToMinutes(values.startTime);
  const rawRuleEndMinutes = parseTimeToMinutes(values.endTime);
  const ruleEndMinutes =
    values.endTime < values.startTime ? rawRuleEndMinutes + MINUTES_IN_DAY : rawRuleEndMinutes;

  if (ruleStartMinutes < businessStartMinutes || ruleEndMinutes > businessEndMinutes) {
    return {
      field: "startTime" as const,
      message: "운영시간 안에서만 최소 인원 조건을 등록할 수 있습니다.",
    };
  }

  return null;
}

function createMinimumStaffingRuleRequestFromForm(
  values: StaffingRuleFormValues,
): CreateMinimumStaffingRuleRequest {
  return {
    dayOfWeek: values.dayOfWeek as DayOfWeek,
    startTime: values.startTime,
    endTime: values.endTime,
    endsNextDay: values.endTime < values.startTime,
    requiredCount: Number(values.requiredCount),
  };
}

const staffingRuleFormResolver: Resolver<StaffingRuleFormValues> = (values) => {
  const request = createMinimumStaffingRuleRequestFromForm(values);
  const result = createMinimumStaffingRuleRequestSchema.safeParse(request);

  if (result.success) {
    return {
      errors: {},
      values,
    };
  }

  const errors: FieldErrors<StaffingRuleFormValues> = {};

  result.error.issues.forEach((issue) => {
    const [field] = issue.path;

    if (field === "dayOfWeek") {
      errors.dayOfWeek = {
        type: "manual",
        message: "요일을 선택하세요.",
      };
      return;
    }

    if (field === "startTime") {
      errors.startTime = {
        type: "manual",
        message: values.startTime ? issue.message : "시작 시간을 선택하세요.",
      };
      return;
    }

    if (field === "endTime") {
      errors.endTime = {
        type: "manual",
        message: values.endTime ? issue.message : "종료 시간을 선택하세요.",
      };
      return;
    }

    if (field === "requiredCount") {
      errors.requiredCount = {
        type: "manual",
        message: "최소 인원은 1 이상의 숫자로 입력하세요.",
      };
    }
  });

  return {
    errors,
    values: {},
  };
};

export function MvpStaffingRulesPage() {
  const organizationQuery = useOrganizationQuery();
  const staffingRulesQuery = useMinimumStaffingRulesQuery();
  const createMinimumStaffingRuleMutation = useCreateMinimumStaffingRuleMutation();
  const updateMinimumStaffingRuleMutation = useUpdateMinimumStaffingRuleMutation();
  const deleteMinimumStaffingRuleMutation = useDeleteMinimumStaffingRuleMutation();
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
  } = useForm<StaffingRuleFormValues>({
    defaultValues: EMPTY_FORM_VALUES,
    resolver: staffingRuleFormResolver,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MinimumStaffingRule | null>(null);
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const businessHours = useMemo(
    () => organizationQuery.data?.businessHours ?? [],
    [organizationQuery.data?.businessHours],
  );
  const rules = staffingRulesQuery.data?.items ?? [];
  const selectedDayOfWeek = watch("dayOfWeek");
  const selectedBusinessHour = getBusinessHourForDay(businessHours, selectedDayOfWeek);
  const selectedBusinessHourLabel = getBusinessHourLabel(selectedBusinessHour);
  const startTimeOptions = createTimeOptions(selectedBusinessHour, "start");
  const endTimeOptions = createTimeOptions(selectedBusinessHour, "end");
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
  const isOrganizationUnavailable = organizationQuery.isPending || organizationQuery.isError;

  function openCreateForm() {
    setEditingRuleId(null);
    reset(EMPTY_FORM_VALUES);
    setFormError("");
    setFormOpen(true);
  }

  function openEditForm(rule: MinimumStaffingRule) {
    setEditingRuleId(rule.id);
    reset(createFormValuesFromRule(rule));
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingRuleId(null);
    reset(EMPTY_FORM_VALUES);
    setFormError("");
  }

  async function saveRule(values: StaffingRuleFormValues) {
    setFormError("");

    if (isSaving) {
      return;
    }

    const request = createMinimumStaffingRuleRequestFromForm(values);
    const policyError = validateRuleBusinessHours(values, businessHours);

    if (policyError) {
      setError(policyError.field, {
        type: "manual",
        message: policyError.message,
      });
      return;
    }

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
      description="영업시간 중 특정 요일과 시간대에 더 필요한 최소 근무 인원을 관리합니다."
      actions={
        <Button
          type="button"
          variant="brand"
          onClick={openCreateForm}
          disabled={staffingRulesQuery.isPending || isOrganizationUnavailable}
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
        emptyDescription="조건을 추가하면 해당 시간대만 가능 시간 입력과 추천 생성 대상이 됩니다."
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
        onSave={handleSubmit(saveRule)}
      >
        <div className="space-y-2">
          <Label htmlFor="staffing-rule-day">요일</Label>
          <Controller
            control={control}
            name="dayOfWeek"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setValue("startTime", "");
                  setValue("endTime", "");
                }}
              >
                <SelectTrigger id="staffing-rule-day" aria-invalid={Boolean(errors.dayOfWeek)}>
                  <SelectValue placeholder="요일을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DAY_LABELS).map(([value, label]) => {
                    const businessHour = getBusinessHourForDay(businessHours, value as DayOfWeek);
                    const isDisabled = !isSelectableBusinessHour(businessHour);

                    return (
                      <SelectItem key={value} value={value} disabled={isDisabled}>
                        {isDisabled ? `${label} · 휴무` : label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          />
          {errors.dayOfWeek ? (
            <p className="text-sm text-destructive">{errors.dayOfWeek.message}</p>
          ) : null}
          {selectedDayOfWeek ? (
            <p className="text-sm text-muted-foreground">{selectedBusinessHourLabel}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="staffing-rule-start-time">시작 시간</Label>
            <Controller
              control={control}
              name="startTime"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!isSelectableBusinessHour(selectedBusinessHour)}
                >
                  <SelectTrigger
                    id="staffing-rule-start-time"
                    aria-invalid={Boolean(errors.startTime)}
                  >
                    <SelectValue placeholder="시작 시간 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {startTimeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.startTime ? (
              <p className="text-sm text-destructive">{errors.startTime.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="staffing-rule-end-time">종료 시간</Label>
            <Controller
              control={control}
              name="endTime"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!isSelectableBusinessHour(selectedBusinessHour)}
                >
                  <SelectTrigger id="staffing-rule-end-time" aria-invalid={Boolean(errors.endTime)}>
                    <SelectValue placeholder="종료 시간 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {endTimeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.endTime ? (
              <p className="text-sm text-destructive">{errors.endTime.message}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minimum-workers">최소 인원</Label>
          <Input
            id="minimum-workers"
            type="number"
            min={1}
            placeholder="예: 2"
            aria-invalid={Boolean(errors.requiredCount)}
            {...register("requiredCount")}
          />
          {errors.requiredCount ? (
            <p className="text-sm text-destructive">{errors.requiredCount.message}</p>
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
