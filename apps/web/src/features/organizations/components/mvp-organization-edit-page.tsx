"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@moyeorak/design-system";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

type BusinessHour = {
  openTime: string;
  closeTime: string;
};

type FormErrors = {
  name?: string;
  businessHours?: Partial<Record<DayOfWeek, string>>;
};

const DAYS: Array<{ value: DayOfWeek; label: string }> = [
  { value: "MON", label: "월요일" },
  { value: "TUE", label: "화요일" },
  { value: "WED", label: "수요일" },
  { value: "THU", label: "목요일" },
  { value: "FRI", label: "금요일" },
  { value: "SAT", label: "토요일" },
  { value: "SUN", label: "일요일" },
];

const DEFAULT_BUSINESS_HOURS: Record<DayOfWeek, BusinessHour> = {
  MON: { openTime: "09:00", closeTime: "22:00" },
  TUE: { openTime: "09:00", closeTime: "22:00" },
  WED: { openTime: "09:00", closeTime: "22:00" },
  THU: { openTime: "09:00", closeTime: "22:00" },
  FRI: { openTime: "09:00", closeTime: "22:00" },
  SAT: { openTime: "10:00", closeTime: "20:00" },
  SUN: { openTime: "10:00", closeTime: "20:00" },
};

function validateOrganizationForm(
  name: string,
  businessHours: Record<DayOfWeek, BusinessHour>,
  weeklyClosedDays: DayOfWeek[],
) {
  const errors: FormErrors = {};
  const businessHourErrors: Partial<Record<DayOfWeek, string>> = {};

  if (!name.trim()) {
    errors.name = "매장명을 입력하세요.";
  }

  DAYS.forEach((day) => {
    if (weeklyClosedDays.includes(day.value)) {
      return;
    }

    const hours = businessHours[day.value];

    if (!hours.openTime || !hours.closeTime) {
      businessHourErrors[day.value] = "운영 시작/종료 시간을 모두 선택하세요.";
      return;
    }

    if (hours.closeTime <= hours.openTime) {
      businessHourErrors[day.value] = "운영 종료 시간은 시작 시간보다 늦어야 합니다.";
    }
  });

  if (DAYS.every((day) => weeklyClosedDays.includes(day.value))) {
    businessHourErrors.MON = "최소 하루 이상 운영 시간이 필요합니다.";
  }

  if (Object.keys(businessHourErrors).length > 0) {
    errors.businessHours = businessHourErrors;
  }

  return errors;
}

export function MvpOrganizationEditPage() {
  const router = useRouter();
  const [name, setName] = useState("강남 스터디 카페");
  const [businessHours, setBusinessHours] =
    useState<Record<DayOfWeek, BusinessHour>>(DEFAULT_BUSINESS_HOURS);
  const [weeklyClosedDays, setWeeklyClosedDays] = useState<DayOfWeek[]>(["SUN"]);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = useMemo(
    () => validateOrganizationForm(name, businessHours, weeklyClosedDays),
    [businessHours, name, weeklyClosedDays],
  );
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

  return (
    <AdminPageShell
      title="매장 수정"
      description="단일 매장의 이름, 요일별 운영 시간, 매주 휴무일을 수정합니다."
      actions={
        <Button asChild variant="outline">
          <Link href="/dashboard">대시보드로 돌아가기</Link>
        </Button>
      }
      contentClassName="space-y-6"
    >
      <form
        className="rounded-xl border border-border bg-card p-6 shadow-card"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);

          if (hasErrors) {
            return;
          }

          setIsSubmitting(true);
          router.push("/dashboard");
        }}
      >
        <div>
          <h2 className="text-lg font-semibold text-foreground">매장 정보</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            휴무일로 지정한 요일은 운영 시간 입력이 비활성화됩니다.
          </p>
        </div>

        <div className="mt-8 space-y-8">
          <div className="space-y-2">
            <Label htmlFor="organization-name">매장명</Label>
            <Input
              id="organization-name"
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
              {DAYS.map((day) => {
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
              {DAYS.map((day) => {
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
          <Button asChild type="button" variant="outline">
            <Link href="/dashboard">취소</Link>
          </Button>
          <Button type="submit" variant="brand" disabled={isSubmitting}>
            {isSubmitting ? "저장 중" : "변경사항 저장"}
          </Button>
        </div>
      </form>
    </AdminPageShell>
  );
}
