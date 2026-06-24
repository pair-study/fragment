"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@moyeorak/design-system";
import { useForm } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createOrganizationRequestFromForm,
  type DayOfWeek,
  type OrganizationFormValues,
  ORGANIZATION_DAYS,
  organizationFormSchema,
} from "../utils/organization-form-utils";

type OrganizationFormProps = {
  cancelHref?: string;
  initialValues: OrganizationFormValues;
  onSubmit: (request: ReturnType<typeof createOrganizationRequestFromForm>) => Promise<void> | void;
  submitError?: string | null;
  submitLabel: string;
  submittingLabel: string;
};

export function OrganizationForm({
  cancelHref,
  initialValues,
  onSubmit,
  submitError,
  submitLabel,
  submittingLabel,
}: OrganizationFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<OrganizationFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(organizationFormSchema),
  });

  const weeklyClosedDays = watch("weeklyClosedDays");

  function toggleWeeklyClosedDay(day: DayOfWeek) {
    const nextWeeklyClosedDays = weeklyClosedDays.includes(day)
      ? weeklyClosedDays.filter((currentDay) => currentDay !== day)
      : [...weeklyClosedDays, day];

    setValue("weeklyClosedDays", nextWeeklyClosedDays, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  async function submitForm(values: OrganizationFormValues) {
    await onSubmit(createOrganizationRequestFromForm(values));
  }

  function getBusinessHourError(day: DayOfWeek) {
    return (
      errors.businessHours?.[day]?.openTime?.message ??
      errors.businessHours?.[day]?.closeTime?.message
    );
  }

  return (
    <form
      className="rounded-xl border border-border bg-card p-6 shadow-card"
      onSubmit={handleSubmit(submitForm)}
    >
      <div>
        <h2 className="text-lg font-semibold text-foreground">조직 정보</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          휴무일로 지정한 요일은 운영 시간 입력이 비활성화됩니다.
        </p>
      </div>

      <div className="mt-8 space-y-8">
        <div className="space-y-2">
          <Label htmlFor="organization-name">조직명</Label>
          <Input
            id="organization-name"
            placeholder="예: 강남 스터디 카페"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
        </div>

        <section className="space-y-4 rounded-lg border border-border p-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">매주 휴무</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              매주 반복해서 쉬는 요일을 선택하세요.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ORGANIZATION_DAYS.map((day) => {
              const selected = weeklyClosedDays.includes(day.value);

              return (
                <button
                  key={day.value}
                  type="button"
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-semibold transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                  onClick={() => toggleWeeklyClosedDay(day.value)}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">요일별 운영 시간</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              스케줄 추천과 가능 시간 입력의 운영 시간 기준으로 사용됩니다.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            {ORGANIZATION_DAYS.map((day) => {
              const closed = weeklyClosedDays.includes(day.value);
              const dayError = getBusinessHourError(day.value);

              return (
                <div
                  key={day.value}
                  className="grid gap-3 border-b border-border px-4 py-4 last:border-b-0 md:grid-cols-[120px_1fr]"
                >
                  <div className="flex items-center justify-between gap-3 md:block">
                    <p className="text-sm font-semibold text-foreground">{day.label}</p>
                    {closed ? (
                      <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                        휴무
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        type="time"
                        disabled={closed}
                        aria-label={`${day.label} 운영 시작 시간`}
                        {...register(`businessHours.${day.value}.openTime`)}
                      />
                      <Input
                        type="time"
                        disabled={closed}
                        aria-label={`${day.label} 운영 종료 시간`}
                        {...register(`businessHours.${day.value}.closeTime`)}
                      />
                    </div>
                    {dayError ? <p className="mt-2 text-sm text-destructive">{dayError}</p> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-8 flex justify-end gap-2">
        {submitError ? (
          <p className="mr-auto self-center text-sm text-destructive">{submitError}</p>
        ) : null}
        {cancelHref ? (
          <Button asChild type="button" variant="outline">
            <Link href={cancelHref}>취소</Link>
          </Button>
        ) : null}
        <Button type="submit" variant="brand" disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
