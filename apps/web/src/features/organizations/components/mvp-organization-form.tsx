"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@moyeorak/design-system";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormErrors = {
  name?: string;
  openTime?: string;
  closeTime?: string;
};

function validateOrganizationForm(name: string, openTime: string, closeTime: string) {
  const errors: FormErrors = {};

  if (!name.trim()) {
    errors.name = "매장명을 입력하세요.";
  }

  if (!openTime) {
    errors.openTime = "운영 시작 시간을 선택하세요.";
  }

  if (!closeTime) {
    errors.closeTime = "운영 종료 시간을 선택하세요.";
  }

  if (openTime && closeTime && closeTime <= openTime) {
    errors.closeTime = "운영 종료 시간은 시작 시간보다 늦어야 합니다.";
  }

  return errors;
}

export function MvpOrganizationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = useMemo(
    () => validateOrganizationForm(name, openTime, closeTime),
    [name, openTime, closeTime],
  );
  const hasErrors = Object.keys(errors).length > 0;

  return (
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
          MVP에서는 단일 매장만 생성하고, 생성 후 바로 관리자 대시보드로 이동합니다.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="organization-name">매장명</Label>
          <Input
            id="organization-name"
            placeholder="예: 강남 스터디 카페"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={submitted && Boolean(errors.name)}
            aria-describedby={submitted && errors.name ? "organization-name-error" : undefined}
          />
          {submitted && errors.name ? (
            <p id="organization-name-error" className="text-sm text-destructive">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="open-time">운영 시작 시간</Label>
            <Input
              id="open-time"
              type="time"
              value={openTime}
              onChange={(event) => setOpenTime(event.target.value)}
              aria-invalid={submitted && Boolean(errors.openTime)}
              aria-describedby={submitted && errors.openTime ? "open-time-error" : undefined}
            />
            {submitted && errors.openTime ? (
              <p id="open-time-error" className="text-sm text-destructive">
                {errors.openTime}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="close-time">운영 종료 시간</Label>
            <Input
              id="close-time"
              type="time"
              value={closeTime}
              onChange={(event) => setCloseTime(event.target.value)}
              aria-invalid={submitted && Boolean(errors.closeTime)}
              aria-describedby={submitted && errors.closeTime ? "close-time-error" : undefined}
            />
            {submitted && errors.closeTime ? (
              <p id="close-time-error" className="text-sm text-destructive">
                {errors.closeTime}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button type="submit" variant="brand" disabled={isSubmitting}>
          {isSubmitting ? "생성 중" : "매장 생성"}
        </Button>
      </div>
    </form>
  );
}
