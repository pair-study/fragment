"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@moyeorak/design-system";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createOrganizationRequestFromForm,
  type BusinessHour,
  type DayOfWeek,
  type OrganizationFormValues,
  ORGANIZATION_DAYS,
  validateOrganizationForm,
} from "../utils/organization-form-utils";

type OrganizationFormProps = {
  cancelHref?: string;
  initialValues: OrganizationFormValues;
  onSubmit: (request: ReturnType<typeof createOrganizationRequestFromForm>) => Promise<void> | void;
  submitLabel: string;
  submittingLabel: string;
};

export function OrganizationForm({
  cancelHref,
  initialValues,
  onSubmit,
  submitLabel,
  submittingLabel,
}: OrganizationFormProps) {
  const [name, setName] = useState(initialValues.name);
  const [businessHours, setBusinessHours] = useState(initialValues.businessHours);
  const [weeklyClosedDays, setWeeklyClosedDays] = useState(initialValues.weeklyClosedDays);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formValues = useMemo(
    () => ({
      name,
      businessHours,
      weeklyClosedDays,
    }),
    [businessHours, name, weeklyClosedDays],
  );
  const errors = useMemo(() => validateOrganizationForm(formValues), [formValues]);
  const hasErrors = Object.keys(errors).length > 0;

  function toggleWeeklyClosedDay(day: DayOfWeek) {
    setWeeklyClosedDays((currentDays) =>
      currentDays.includes(day)
        ? currentDays.filter((currentDay) => currentDay !== day)
        : [...currentDays, day],
    );
  }

  function updateBusinessHour(day: DayOfWeek, field: keyof BusinessHour, value: string) {
    setBusinessHours((currentHours) => ({
      ...currentHours,
      [day]: {
        ...currentHours[day],
        [field]: value,
      },
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(createOrganizationRequestFromForm(formValues));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="rounded-xl border border-border bg-card p-6 shadow-card"
      onSubmit={handleSubmit}
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
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={submitted && Boolean(errors.name)}
          />
          {submitted && errors.name ? (
            <p className="text-sm text-destructive">{errors.name}</p>
          ) : null}
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
              const dayError = errors.businessHours?.[day.value];

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
                        value={businessHours[day.value].openTime}
                        disabled={closed}
                        aria-label={`${day.label} 운영 시작 시간`}
                        onChange={(event) =>
                          updateBusinessHour(day.value, "openTime", event.target.value)
                        }
                      />
                      <Input
                        type="time"
                        value={businessHours[day.value].closeTime}
                        disabled={closed}
                        aria-label={`${day.label} 운영 종료 시간`}
                        onChange={(event) =>
                          updateBusinessHour(day.value, "closeTime", event.target.value)
                        }
                      />
                    </div>
                    {submitted && dayError ? (
                      <p className="mt-2 text-sm text-destructive">{dayError}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-8 flex justify-end gap-2">
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
