"use client";

import {
  createMinimumStaffingRuleRequestSchema,
  type CreateMinimumStaffingRuleRequest,
  type MinimumStaffingRule,
  type OrganizationDetail,
} from "@fragment/shared";
import { useMemo, useState } from "react";
import { Button } from "@moyeorak/design-system";
import { Plus, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
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

type BatchStaffingRuleFormValues = {
  dayOfWeeks: DayOfWeek[];
  startTime: string;
  endTime: string;
  requiredCount: string;
};

type DraftStaffingRule = CreateMinimumStaffingRuleRequest & {
  id: string;
};

type DraftStaffingRuleGroup = {
  dayOfWeek: DayOfWeek;
  id: string;
  rules: DraftStaffingRule[];
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

const DAY_ORDER: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const EMPTY_FORM_VALUES: StaffingRuleFormValues = {
  dayOfWeek: "",
  startTime: "",
  endTime: "",
  requiredCount: "",
};

const EMPTY_BATCH_FORM_VALUES: BatchStaffingRuleFormValues = {
  dayOfWeeks: [],
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
  const lastMinutes =
    boundary === "start"
      ? Math.min(endMinutes - TIME_OPTION_STEP_MINUTES, MINUTES_IN_DAY - TIME_OPTION_STEP_MINUTES)
      : endMinutes;
  const options: { label: string; value: string }[] = [];

  for (let minutes = firstMinutes; minutes <= lastMinutes; minutes += TIME_OPTION_STEP_MINUTES) {
    const value = minutesToTime(minutes);
    const label = minutes >= MINUTES_IN_DAY ? `${value} 다음날` : value;

    options.push({ label, value });
  }

  return options;
}

function createTimeOptionsFromRange(
  range: { endMinutes: number; startMinutes: number } | null,
  boundary: "start" | "end",
): { label: string; value: string }[] {
  if (!range) {
    return [];
  }

  const firstMinutes =
    boundary === "start" ? range.startMinutes : range.startMinutes + TIME_OPTION_STEP_MINUTES;
  const lastMinutes =
    boundary === "start"
      ? Math.min(
          range.endMinutes - TIME_OPTION_STEP_MINUTES,
          MINUTES_IN_DAY - TIME_OPTION_STEP_MINUTES,
        )
      : range.endMinutes;
  const options: { label: string; value: string }[] = [];

  for (let minutes = firstMinutes; minutes <= lastMinutes; minutes += TIME_OPTION_STEP_MINUTES) {
    const value = minutesToTime(minutes);
    const label = minutes >= MINUTES_IN_DAY ? `${value} 다음날` : value;

    options.push({ label, value });
  }

  return options;
}

function getCommonBusinessHourRange(businessHours: BusinessHour[], dayOfWeeks: DayOfWeek[]) {
  if (dayOfWeeks.length === 0) {
    return null;
  }

  const ranges = dayOfWeeks.flatMap((dayOfWeek) => {
    const businessHour = getBusinessHourForDay(businessHours, dayOfWeek);

    if (!isSelectableBusinessHour(businessHour) || !businessHour?.openTime) {
      return [];
    }

    return [
      {
        endMinutes: getBusinessHourEndMinutes(businessHour),
        startMinutes: parseTimeToMinutes(businessHour.openTime),
      },
    ];
  });

  if (ranges.length !== dayOfWeeks.length) {
    return null;
  }

  const startMinutes = Math.max(...ranges.map((range) => range.startMinutes));
  const endMinutes = Math.min(...ranges.map((range) => range.endMinutes));

  if (startMinutes >= endMinutes) {
    return null;
  }

  return {
    endMinutes,
    startMinutes,
  };
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

function getBatchBusinessHourLabel(businessHours: BusinessHour[], dayOfWeeks: DayOfWeek[]) {
  if (dayOfWeeks.length === 0) {
    return "요일을 선택하면 선택한 요일들의 공통 운영시간 안에서 시간을 고를 수 있습니다.";
  }

  const commonRange = getCommonBusinessHourRange(businessHours, dayOfWeeks);

  if (!commonRange) {
    return "선택한 요일 사이에 공통으로 입력 가능한 운영시간이 없습니다.";
  }

  return `공통 입력 가능 시간: ${minutesToTime(commonRange.startMinutes)}-${minutesToTime(
    commonRange.endMinutes,
  )}${commonRange.endMinutes >= MINUTES_IN_DAY ? " 다음날" : ""}`;
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

function validateBatchRuleBusinessHours(
  values: BatchStaffingRuleFormValues,
  businessHours: BusinessHour[],
) {
  if (values.dayOfWeeks.length === 0 || !values.startTime || !values.endTime) {
    return null;
  }

  for (const dayOfWeek of values.dayOfWeeks) {
    const policyError = validateRuleBusinessHours(
      {
        dayOfWeek,
        endTime: values.endTime,
        requiredCount: values.requiredCount,
        startTime: values.startTime,
      },
      businessHours,
    );

    if (policyError) {
      return {
        field: policyError.field === "dayOfWeek" ? ("dayOfWeeks" as const) : policyError.field,
        message: `${DAY_LABELS[dayOfWeek]}: ${policyError.message}`,
      };
    }
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

function createMinimumStaffingRuleRequestsFromBatchForm(
  values: BatchStaffingRuleFormValues,
): CreateMinimumStaffingRuleRequest[] {
  return values.dayOfWeeks.map((dayOfWeek) => ({
    dayOfWeek,
    startTime: values.startTime,
    endTime: values.endTime,
    endsNextDay: values.endTime < values.startTime,
    requiredCount: Number(values.requiredCount),
  }));
}

function createDraftRuleId(rule: CreateMinimumStaffingRuleRequest) {
  return `${rule.dayOfWeek}:${rule.startTime}:${rule.endTime}:${rule.requiredCount}`;
}

function hasSameDraftRule(
  firstRule: CreateMinimumStaffingRuleRequest,
  secondRule: CreateMinimumStaffingRuleRequest,
) {
  return (
    firstRule.dayOfWeek === secondRule.dayOfWeek &&
    firstRule.startTime === secondRule.startTime &&
    firstRule.endTime === secondRule.endTime &&
    firstRule.requiredCount === secondRule.requiredCount
  );
}

function groupDraftRulesByDay(rules: DraftStaffingRule[]): DraftStaffingRuleGroup[] {
  const groups = new Map<string, DraftStaffingRuleGroup>();

  rules.forEach((rule) => {
    const group = groups.get(rule.dayOfWeek);

    if (group) {
      group.rules.push(rule);
      return;
    }

    groups.set(rule.dayOfWeek, {
      dayOfWeek: rule.dayOfWeek,
      id: rule.dayOfWeek,
      rules: [rule],
    });
  });

  return Array.from(groups.values())
    .sort(
      (firstGroup, secondGroup) =>
        DAY_ORDER.indexOf(firstGroup.dayOfWeek) - DAY_ORDER.indexOf(secondGroup.dayOfWeek),
    )
    .map((group) => ({
      ...group,
      rules: [...group.rules].sort((firstRule, secondRule) => {
        if (firstRule.startTime !== secondRule.startTime) {
          return firstRule.startTime.localeCompare(secondRule.startTime);
        }

        if (firstRule.endTime !== secondRule.endTime) {
          return firstRule.endTime.localeCompare(secondRule.endTime);
        }

        return firstRule.requiredCount - secondRule.requiredCount;
      }),
    }));
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

const createBatchStaffingRuleFormResolver =
  (businessHours: BusinessHour[]): Resolver<BatchStaffingRuleFormValues> =>
  (values) => {
    const errors: FieldErrors<BatchStaffingRuleFormValues> = {};

    if (values.dayOfWeeks.length === 0) {
      errors.dayOfWeeks = {
        type: "manual",
        message: "요일을 하나 이상 선택하세요.",
      };
    }

    const requests = createMinimumStaffingRuleRequestsFromBatchForm(values);
    const result =
      requests.length > 0
        ? createMinimumStaffingRuleRequestSchema.safeParse(requests[0])
        : createMinimumStaffingRuleRequestSchema.safeParse({
            dayOfWeek: "MON",
            endTime: values.endTime,
            endsNextDay: values.endTime < values.startTime,
            requiredCount: Number(values.requiredCount),
            startTime: values.startTime,
          });

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const [field] = issue.path;

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
    }

    const policyError = validateBatchRuleBusinessHours(values, businessHours);

    if (policyError) {
      errors[policyError.field] = {
        type: "manual",
        message: policyError.message,
      };
    }

    if (Object.keys(errors).length === 0) {
      return {
        errors: {},
        values,
      };
    }

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
  const businessHours = useMemo(
    () => organizationQuery.data?.businessHours ?? [],
    [organizationQuery.data?.businessHours],
  );
  const {
    control: editControl,
    formState: { errors: editErrors },
    handleSubmit: handleEditSubmit,
    register: registerEdit,
    reset: resetEditForm,
    setError: setEditError,
    setValue: setEditValue,
    watch: watchEditForm,
  } = useForm<StaffingRuleFormValues>({
    defaultValues: EMPTY_FORM_VALUES,
    resolver: staffingRuleFormResolver,
  });
  const {
    control: batchControl,
    formState: { errors: batchErrors },
    getValues: getBatchValues,
    handleSubmit: handleBatchSubmit,
    register: registerBatch,
    reset: resetBatchForm,
    setError: setBatchError,
    setValue: setBatchValue,
    watch: watchBatchForm,
  } = useForm<BatchStaffingRuleFormValues>({
    defaultValues: EMPTY_BATCH_FORM_VALUES,
    resolver: createBatchStaffingRuleFormResolver(businessHours),
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MinimumStaffingRule | null>(null);
  const [draftRules, setDraftRules] = useState<DraftStaffingRule[]>([]);
  const [batchFormError, setBatchFormError] = useState("");
  const [editFormError, setEditFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const rules = staffingRulesQuery.data?.items ?? [];
  const selectedDayOfWeek = watchEditForm("dayOfWeek");
  const selectedBusinessHour = getBusinessHourForDay(businessHours, selectedDayOfWeek);
  const selectedBusinessHourLabel = getBusinessHourLabel(selectedBusinessHour);
  const startTimeOptions = createTimeOptions(selectedBusinessHour, "start");
  const endTimeOptions = createTimeOptions(selectedBusinessHour, "end");
  const groupedDraftRules = useMemo(() => groupDraftRulesByDay(draftRules), [draftRules]);
  const selectedBatchDayOfWeeks = watchBatchForm("dayOfWeeks");
  const batchCommonBusinessHourRange = getCommonBusinessHourRange(
    businessHours,
    selectedBatchDayOfWeeks,
  );
  const batchStartTimeOptions = createTimeOptionsFromRange(batchCommonBusinessHourRange, "start");
  const batchEndTimeOptions = createTimeOptionsFromRange(batchCommonBusinessHourRange, "end");
  const batchBusinessHourLabel = getBatchBusinessHourLabel(businessHours, selectedBatchDayOfWeeks);
  const batchInputErrorMessage =
    batchErrors.startTime?.message ??
    batchErrors.endTime?.message ??
    batchErrors.requiredCount?.message;
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

  function openEditForm(rule: MinimumStaffingRule) {
    setEditingRuleId(rule.id);
    resetEditForm(createFormValuesFromRule(rule));
    setEditFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingRuleId(null);
    resetEditForm(EMPTY_FORM_VALUES);
    setEditFormError("");
  }

  function addDraftRules(values: BatchStaffingRuleFormValues) {
    setBatchFormError("");

    const requests = createMinimumStaffingRuleRequestsFromBatchForm(values);
    const duplicatedRequest = requests.find((request) =>
      draftRules.some((draftRule) => hasSameDraftRule(draftRule, request)),
    );
    const duplicatedExistingRule = requests.find((request) =>
      rules.some((rule) => hasSameDraftRule(rule, request)),
    );

    if (duplicatedRequest) {
      setBatchError("dayOfWeeks", {
        type: "manual",
        message: `${DAY_LABELS[duplicatedRequest.dayOfWeek]} ${duplicatedRequest.startTime}-${
          duplicatedRequest.endTime
        } ${duplicatedRequest.requiredCount}명 조건이 이미 추가되어 있습니다.`,
      });
      return;
    }

    if (duplicatedExistingRule) {
      setBatchError("dayOfWeeks", {
        type: "manual",
        message: `${DAY_LABELS[duplicatedExistingRule.dayOfWeek]} ${
          duplicatedExistingRule.startTime
        }-${duplicatedExistingRule.endTime} ${
          duplicatedExistingRule.requiredCount
        }명 조건이 이미 조건 목록에 있습니다.`,
      });
      return;
    }

    setDraftRules((currentRules) => [
      ...currentRules,
      ...requests.map((request) => ({
        ...request,
        id: createDraftRuleId(request),
      })),
    ]);
    resetBatchForm({
      ...values,
      dayOfWeeks: [],
      endTime: "",
      startTime: "",
    });
  }

  function removeDraftRule(ruleId: string) {
    setDraftRules((currentRules) => currentRules.filter((rule) => rule.id !== ruleId));
    setBatchFormError("");
  }

  async function createRules(requests: CreateMinimumStaffingRuleRequest[]) {
    for (const request of requests) {
      await createMinimumStaffingRuleMutation.mutateAsync(request);
    }
  }

  async function saveBatchRules() {
    setBatchFormError("");

    if (isSaving) {
      return;
    }

    const values = getBatchValues();
    const hasAnyCurrentInput =
      values.dayOfWeeks.length > 0 || values.startTime || values.endTime || values.requiredCount;
    const hasCompleteCurrentInput =
      values.dayOfWeeks.length > 0 && values.startTime && values.endTime && values.requiredCount;

    if (!hasAnyCurrentInput && draftRules.length === 0) {
      setBatchError("dayOfWeeks", {
        type: "manual",
        message: "저장할 조건을 하나 이상 추가하세요.",
      });
      return;
    }

    if (hasCompleteCurrentInput || draftRules.length === 0) {
      await handleBatchSubmit(async (batchValues) => {
        const requests = createMinimumStaffingRuleRequestsFromBatchForm(batchValues);
        const allRequests = [...draftRules, ...requests];
        const duplicatedRequest = requests.find((request) =>
          draftRules.some((draftRule) => hasSameDraftRule(draftRule, request)),
        );
        const duplicatedExistingRule = requests.find((request) =>
          rules.some((rule) => hasSameDraftRule(rule, request)),
        );

        if (duplicatedRequest) {
          setBatchError("dayOfWeeks", {
            type: "manual",
            message: `${DAY_LABELS[duplicatedRequest.dayOfWeek]} ${duplicatedRequest.startTime}-${
              duplicatedRequest.endTime
            } ${duplicatedRequest.requiredCount}명 조건이 이미 추가되어 있습니다.`,
          });
          return;
        }

        if (duplicatedExistingRule) {
          setBatchError("dayOfWeeks", {
            type: "manual",
            message: `${DAY_LABELS[duplicatedExistingRule.dayOfWeek]} ${
              duplicatedExistingRule.startTime
            }-${duplicatedExistingRule.endTime} ${
              duplicatedExistingRule.requiredCount
            }명 조건이 이미 조건 목록에 있습니다.`,
          });
          return;
        }

        try {
          await createRules(allRequests);
          resetBatchForm(EMPTY_BATCH_FORM_VALUES);
          setDraftRules([]);
        } catch (error) {
          setBatchFormError(
            getApiErrorMessage(error, "최소 인원 조건을 저장하지 못했습니다. 다시 시도해 주세요."),
          );
        }
      })();
      return;
    }

    try {
      await createRules(draftRules);
      resetBatchForm(EMPTY_BATCH_FORM_VALUES);
      setDraftRules([]);
    } catch (error) {
      setBatchFormError(
        getApiErrorMessage(error, "최소 인원 조건을 저장하지 못했습니다. 다시 시도해 주세요."),
      );
    }
  }

  async function saveRule(values: StaffingRuleFormValues) {
    setEditFormError("");

    if (isSaving || !editingRuleId) {
      return;
    }

    const request = createMinimumStaffingRuleRequestFromForm(values);
    const policyError = validateRuleBusinessHours(values, businessHours);

    if (policyError) {
      setEditError(policyError.field, {
        type: "manual",
        message: policyError.message,
      });
      return;
    }

    try {
      await updateMinimumStaffingRuleMutation.mutateAsync({
        ruleId: editingRuleId,
        request,
      });

      closeForm();
    } catch (error) {
      setEditFormError(
        getApiErrorMessage(error, "최소 인원 조건을 저장하지 못했습니다. 다시 시도해 주세요."),
      );
    }
  }

  return (
    <AdminPageShell
      title="최소 인원 조건"
      description="영업시간 중 특정 요일과 시간대에 더 필요한 최소 근무 인원을 관리합니다."
      containerClassName="max-w-none"
      contentClassName="space-y-6"
    >
      <section className="rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">조건 추가</h2>
          <p className="mt-1 text-sm text-pretty text-muted-foreground">
            요일과 시간대, 최소 인원을 한 세트로 추가하고 여러 조건을 한 번에 저장하세요.
          </p>
        </div>

        <div className="space-y-6 p-6">
          <div className="space-y-3">
            <Label>요일</Label>
            <Controller
              control={batchControl}
              name="dayOfWeeks"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {DAY_ORDER.map((dayOfWeek) => {
                    const businessHour = getBusinessHourForDay(businessHours, dayOfWeek);
                    const isDisabled = !isSelectableBusinessHour(businessHour);
                    const checked = field.value.includes(dayOfWeek);

                    return (
                      <button
                        key={dayOfWeek}
                        type="button"
                        className={cn(
                          "rounded-md border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
                          isDisabled
                            ? "bg-surface-secondary hover:bg-surface-secondary hover:text-muted-foreground"
                            : "",
                        )}
                        disabled={isDisabled || isOrganizationUnavailable}
                        aria-pressed={checked}
                        onClick={() => {
                          const nextValue = checked
                            ? field.value.filter((item) => item !== dayOfWeek)
                            : [...field.value, dayOfWeek];

                          field.onChange(nextValue);
                          setBatchValue("startTime", "");
                          setBatchValue("endTime", "");
                        }}
                      >
                        {isDisabled ? `${DAY_LABELS[dayOfWeek]} · 휴무` : DAY_LABELS[dayOfWeek]}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {batchErrors.dayOfWeeks ? (
              <p className="text-sm text-destructive">{batchErrors.dayOfWeeks.message}</p>
            ) : null}
            <p className="text-sm text-muted-foreground">{batchBusinessHourLabel}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_120px_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="batch-staffing-rule-start-time">시작 시간</Label>
              <Controller
                control={batchControl}
                name="startTime"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!batchCommonBusinessHourRange || isOrganizationUnavailable}
                  >
                    <SelectTrigger
                      id="batch-staffing-rule-start-time"
                      aria-invalid={Boolean(batchErrors.startTime)}
                    >
                      <SelectValue placeholder="시작 시간" />
                    </SelectTrigger>
                    <SelectContent>
                      {batchStartTimeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-staffing-rule-end-time">종료 시간</Label>
              <Controller
                control={batchControl}
                name="endTime"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!batchCommonBusinessHourRange || isOrganizationUnavailable}
                  >
                    <SelectTrigger
                      id="batch-staffing-rule-end-time"
                      aria-invalid={Boolean(batchErrors.endTime)}
                    >
                      <SelectValue placeholder="종료 시간" />
                    </SelectTrigger>
                    <SelectContent>
                      {batchEndTimeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-minimum-workers">최소 인원</Label>
              <Input
                id="batch-minimum-workers"
                type="number"
                min={1}
                placeholder="예: 2"
                aria-invalid={Boolean(batchErrors.requiredCount)}
                disabled={isOrganizationUnavailable}
                {...registerBatch("requiredCount")}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleBatchSubmit(addDraftRules)}
              disabled={isSaving || isOrganizationUnavailable}
            >
              <Plus className="size-4" aria-hidden="true" />
              목록에 추가
            </Button>
            {batchInputErrorMessage ? (
              <p className="text-sm text-destructive sm:col-span-4">{batchInputErrorMessage}</p>
            ) : null}
          </div>

          <section className="overflow-hidden rounded-lg border border-border">
            <div className="border-b border-border bg-surface-secondary px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">저장할 조건</h3>
            </div>
            {draftRules.length > 0 ? (
              <div className="max-h-64 overflow-y-auto lg:max-h-none">
                <table className="w-full min-w-max table-fixed border-collapse text-left text-sm">
                  <colgroup>
                    <col className="w-24 sm:w-32" />
                    <col />
                  </colgroup>
                  <thead className="bg-surface-secondary text-xs font-semibold uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">요일</th>
                      <th className="px-4 py-3">조건</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {groupedDraftRules.map((group) => (
                      <tr key={group.id}>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                          {DAY_LABELS[group.dayOfWeek]}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap">
                            {group.rules.map((rule) => (
                              <div
                                key={rule.id}
                                className="flex items-center justify-between gap-3 rounded-md bg-surface-secondary px-3 py-2 lg:w-auto"
                              >
                                <span className="text-sm text-muted-foreground">
                                  <span className="font-medium text-foreground tabular-nums">
                                    {rule.startTime}-{rule.endTime}
                                    {rule.endsNextDay ? " 다음날" : ""}
                                  </span>
                                  <span className="mx-2 text-border">|</span>
                                  {rule.requiredCount}명
                                </span>
                                <button
                                  type="button"
                                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                                  aria-label={`${DAY_LABELS[rule.dayOfWeek]} ${rule.startTime}-${
                                    rule.endTime
                                  } ${rule.requiredCount}명 조건 삭제`}
                                  onClick={() => removeDraftRule(rule.id)}
                                >
                                  <Trash2 className="size-4" aria-hidden="true" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                아직 추가된 조건이 없습니다. 요일과 시간대, 최소 인원을 입력한 뒤 목록에 추가하세요.
              </p>
            )}
          </section>

          {batchFormError ? <p className="text-sm text-destructive">{batchFormError}</p> : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetBatchForm(EMPTY_BATCH_FORM_VALUES);
                setDraftRules([]);
                setBatchFormError("");
              }}
              disabled={isSaving}
            >
              초기화
            </Button>
            <Button
              type="button"
              variant="brand"
              onClick={saveBatchRules}
              disabled={isSaving || isOrganizationUnavailable}
            >
              {createMinimumStaffingRuleMutation.isPending ? "저장 중..." : "조건 저장"}
            </Button>
          </div>
        </div>
      </section>

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
        title="조건 수정"
        description="특정 요일과 시간대에 필요한 최소 근무 인원을 입력하세요."
        isSaving={isSaving}
        onClose={closeForm}
        onSave={handleEditSubmit(saveRule)}
      >
        <div className="space-y-2">
          <Label htmlFor="staffing-rule-day">요일</Label>
          <Controller
            control={editControl}
            name="dayOfWeek"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setEditValue("startTime", "");
                  setEditValue("endTime", "");
                }}
              >
                <SelectTrigger id="staffing-rule-day" aria-invalid={Boolean(editErrors.dayOfWeek)}>
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
          {editErrors.dayOfWeek ? (
            <p className="text-sm text-destructive">{editErrors.dayOfWeek.message}</p>
          ) : null}
          {selectedDayOfWeek ? (
            <p className="text-sm text-muted-foreground">{selectedBusinessHourLabel}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="staffing-rule-start-time">시작 시간</Label>
            <Controller
              control={editControl}
              name="startTime"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!isSelectableBusinessHour(selectedBusinessHour)}
                >
                  <SelectTrigger
                    id="staffing-rule-start-time"
                    aria-invalid={Boolean(editErrors.startTime)}
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
            {editErrors.startTime ? (
              <p className="text-sm text-destructive">{editErrors.startTime.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="staffing-rule-end-time">종료 시간</Label>
            <Controller
              control={editControl}
              name="endTime"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!isSelectableBusinessHour(selectedBusinessHour)}
                >
                  <SelectTrigger
                    id="staffing-rule-end-time"
                    aria-invalid={Boolean(editErrors.endTime)}
                  >
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
            {editErrors.endTime ? (
              <p className="text-sm text-destructive">{editErrors.endTime.message}</p>
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
            aria-invalid={Boolean(editErrors.requiredCount)}
            {...registerEdit("requiredCount")}
          />
          {editErrors.requiredCount ? (
            <p className="text-sm text-destructive">{editErrors.requiredCount.message}</p>
          ) : null}
        </div>

        {editFormError ? <p className="text-sm text-destructive">{editFormError}</p> : null}
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
