"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, FileText, Lock, Plus, Search, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { GpsRadiusField } from "./gps-radius-field";
import { type ClosureRule, OrganizationClosureSection } from "./organization-closure-section";
import { OrganizationDeleteSection } from "./organization-delete-section";
import { type WorkType, WorkTypeField } from "./work-type-field";

type OrganizationFormMode = "create" | "edit";
type CreateStep = 1 | 2;

type OrganizationFormProps = {
  mode: OrganizationFormMode;
};

const createInitialClosures: ClosureRule[] = [];

const editInitialClosures: ClosureRule[] = [
  {
    id: "weekly-sunday",
    type: "weekly",
    value: "일요일",
    label: "정기 휴무",
  },
  {
    id: "specific-lunar-new-year",
    type: "specific",
    value: "2026-02-17",
    label: "설날 연휴",
  },
];

const PAYROLL_MONTH_OPTIONS = [
  { value: "previous", label: "전월" },
  { value: "current", label: "당월" },
  { value: "next", label: "익월" },
];

export function OrganizationForm({ mode }: OrganizationFormProps) {
  const isEdit = mode === "edit";
  const [createStep, setCreateStep] = useState<CreateStep>(1);
  const [businessNumber, setBusinessNumber] = useState(isEdit ? "123-45-67890" : "");
  const [organizationName, setOrganizationName] = useState(isEdit ? "강남 운영 조직" : "");
  const [businessVerified, setBusinessVerified] = useState(isEdit);
  const [roadAddress, setRoadAddress] = useState(isEdit ? "서울 강남구 테헤란로 142" : "");
  const [addressDetail, setAddressDetail] = useState(isEdit ? "아크플레이스 1층" : "");
  const [radius, setRadius] = useState(isEdit ? 120 : 100);
  const [workType, setWorkType] = useState<WorkType | null>(isEdit ? "flexible" : null);
  const [payrollPeriodStartMonth, setPayrollPeriodStartMonth] = useState("current");
  const [payrollPeriodStartDay, setPayrollPeriodStartDay] = useState("1");
  const [payrollPeriodEndMonth, setPayrollPeriodEndMonth] = useState("current");
  const [payrollPeriodEndDay, setPayrollPeriodEndDay] = useState("31");
  const [payrollPayMonth, setPayrollPayMonth] = useState("next");
  const [payrollPayDay, setPayrollPayDay] = useState("10");
  const [closures, setClosures] = useState<ClosureRule[]>(
    isEdit ? editInitialClosures : createInitialClosures,
  );
  const hasInvalidClosure = closures.some((closure) => !closure.label.trim());
  const canSubmitBasicInfo =
    businessVerified &&
    businessNumber.trim().length > 0 &&
    organizationName.trim().length > 0 &&
    roadAddress.trim().length > 0 &&
    radius >= 50 &&
    radius <= 300 &&
    workType !== null &&
    payrollPeriodStartDay.trim().length > 0 &&
    payrollPeriodEndDay.trim().length > 0 &&
    payrollPayDay.trim().length > 0;
  const canSubmit = isEdit || (canSubmitBasicInfo && !hasInvalidClosure);

  return (
    <div className="space-y-6">
      {!isEdit ? <CreateStepIndicator currentStep={createStep} /> : null}

      {isEdit || createStep === 1 ? (
        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div>
            <h2 className="text-lg font-semibold text-foreground">기본 정보</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isEdit ? "사업자등록번호는 생성 후 변경할 수 없어요." : "모든 항목은 필수예요."}
            </p>
          </div>

          <div className="mt-8 space-y-7">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="business-number">
                  사업자등록번호 <RequiredMark hidden={isEdit} />
                </Label>
                {businessVerified ? (
                  <Badge variant="confirmed">
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    진위 확인 완료
                  </Badge>
                ) : null}
              </div>
              <div className={cn("grid gap-3", !isEdit && "md:grid-cols-[1fr_auto]")}>
                <div className="relative">
                  <Input
                    id="business-number"
                    readOnly={isEdit}
                    placeholder="000-00-00000"
                    value={businessNumber}
                    onChange={(event) => {
                      setBusinessNumber(event.target.value);
                      setBusinessVerified(false);
                    }}
                    className={cn(isEdit && "bg-surface-secondary pr-10")}
                  />
                  {isEdit ? (
                    <Lock
                      className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
                {!isEdit ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    disabled={!businessNumber.trim()}
                    onClick={() => setBusinessVerified(true)}
                  >
                    <ShieldCheck className="size-4" aria-hidden="true" />
                    진위 확인
                  </Button>
                ) : null}
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                {isEdit
                  ? "사업자등록번호는 급여·세무 정보와 연결되어 직접 변경할 수 없어요."
                  : "진위 확인을 통과해야 저장할 수 있어요. 한 번 등록한 번호는 변경할 수 없어요."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization-name">
                조직명 <RequiredMark />
              </Label>
              <Input
                id="organization-name"
                placeholder="예: 강남 운영 조직"
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                근무자 앱과 급여명세서에 표시되는 이름이에요.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="road-address">
                주소 <RequiredMark />
              </Label>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <Input
                  id="road-address"
                  readOnly
                  value={roadAddress}
                  placeholder="주소 검색에서 도로명 주소를 선택하세요"
                  className="bg-surface-secondary"
                  onChange={(event) => setRoadAddress(event.target.value)}
                />
                <Button
                  type="button"
                  variant={isEdit ? "outline" : "default"}
                  className="h-11"
                  onClick={() => setRoadAddress("서울 강남구 테헤란로 142")}
                >
                  <Search className="size-4" aria-hidden="true" />
                  {isEdit ? "주소 변경" : "주소 검색"}
                </Button>
              </div>
              <Input
                placeholder="상세주소 (동·층·호)"
                value={addressDetail}
                onChange={(event) => setAddressDetail(event.target.value)}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                도로명주소 검색 결과에서만 선택할 수 있어요. 선택 시 좌표가 자동 저장돼요.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label>
                  GPS 허용 반경 <RequiredMark />
                </Label>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  이 반경 안에서만 출퇴근 체크가 인정돼요. 50m~300m 범위에서 설정할 수 있어요.
                </p>
              </div>
              <GpsRadiusField
                value={radius}
                hasAddress={Boolean(roadAddress)}
                onChange={setRadius}
              />
            </div>

            <div className="space-y-3">
              <div>
                <Label>
                  근무 유형 <RequiredMark />
                </Label>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  이 조직에서 근무를 배정하는 방식을 선택하세요.
                </p>
              </div>
              <WorkTypeField value={workType} onChange={setWorkType} />
            </div>

            <div className="space-y-3">
              <div>
                <Label>
                  정산 주기 <RequiredMark />
                </Label>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  정산 기간과 지급일의 기준월·일자를 지정하세요.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <PayrollDayField
                  id="create-period-start-day"
                  label="정산 시작일"
                  monthValue={payrollPeriodStartMonth}
                  onMonthChange={setPayrollPeriodStartMonth}
                  value={payrollPeriodStartDay}
                  onChange={setPayrollPeriodStartDay}
                />
                <PayrollDayField
                  id="create-period-end-day"
                  label="정산 종료일"
                  monthValue={payrollPeriodEndMonth}
                  onMonthChange={setPayrollPeriodEndMonth}
                  value={payrollPeriodEndDay}
                  onChange={setPayrollPeriodEndDay}
                />
                <PayrollDayField
                  id="create-pay-day"
                  label="지급일"
                  monthValue={payrollPayMonth}
                  onMonthChange={setPayrollPayMonth}
                  value={payrollPayDay}
                  onChange={setPayrollPayDay}
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {isEdit || createStep === 2 ? (
        <>
          {!isEdit ? <PayStandardSetupCard /> : null}
          <OrganizationClosureSection rules={closures} onChange={setClosures} />
        </>
      ) : null}

      {isEdit ? <OrganizationDeleteSection activeWorkerCount={2} /> : null}

      <Card>
        <CardContent className="flex flex-col-reverse gap-3 p-4 sm:flex-row sm:justify-end">
          {isEdit ? (
            <>
              <Button type="button" variant="outline" asChild>
                <Link href="/organizations">변경 취소</Link>
              </Button>
              <Button type="button" className="min-w-48" disabled={!canSubmit}>
                <Check className="size-4" aria-hidden="true" />
                변경사항 저장
              </Button>
            </>
          ) : createStep === 1 ? (
            <>
              <Button type="button" variant="outline" asChild>
                <Link href="/organizations/empty">취소</Link>
              </Button>
              <Button
                type="button"
                className="min-w-48"
                disabled={!canSubmitBasicInfo}
                onClick={() => setCreateStep(2)}
              >
                다음
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => setCreateStep(1)}>
                이전
              </Button>
              <Button type="button" className="min-w-48" disabled={!canSubmit}>
                <Check className="size-4" aria-hidden="true" />
                조직 생성 완료
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateStepIndicator({ currentStep }: { currentStep: CreateStep }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <StepItem
        active={currentStep === 1}
        number="1"
        title="기본 정보"
        description="사업자 정보, 위치, 근무 유형, 정산 주기"
      />
      <StepItem
        active={currentStep === 2}
        number="2"
        title="운영 설정"
        description="급여 기준과 조직 휴무일"
      />
    </div>
  );
}

function StepItem({
  active,
  number,
  title,
  description,
}: {
  active: boolean;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        active && "border-primary/50 bg-primary/5",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
            active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {number}
        </span>
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

function PayrollDayField({
  id,
  label,
  monthValue,
  onMonthChange,
  value,
  onChange,
}: {
  id: string;
  label: string;
  monthValue: string;
  onMonthChange: (value: string) => void;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="grid grid-cols-[6.5rem_minmax(0,1fr)_auto] items-center gap-2">
        <Select value={monthValue} onValueChange={onMonthChange}>
          <SelectTrigger>
            <SelectValue placeholder="기준월" />
          </SelectTrigger>
          <SelectContent>
            {PAYROLL_MONTH_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={id}
          type="number"
          min={1}
          max={31}
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="tabular-nums"
        />
        <span className="text-sm text-muted-foreground">일</span>
      </div>
    </div>
  );
}

function PayStandardSetupCard() {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">급여 기준</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            근무자에게 적용할 기본 급여 계산 기준을 먼저 만들어 두세요.
          </p>
        </div>
        <Button type="button" variant="outline">
          <Plus className="size-4" aria-hidden="true" />
          기준 추가
        </Button>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface-secondary p-5">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
          <p className="font-semibold text-foreground">주간 시급제 기본</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="create-pay-standard-name">이름</Label>
            <Input id="create-pay-standard-name" defaultValue="주간 시급제 기본" />
          </div>
          <div className="space-y-2">
            <Label>급여 타입</Label>
            <Select defaultValue="hourly">
              <SelectTrigger>
                <SelectValue placeholder="급여 타입 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">시급</SelectItem>
                <SelectItem value="daily">일급</SelectItem>
                <SelectItem value="monthly">월급</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-pay-standard-amount">기준 금액</Label>
            <Input
              id="create-pay-standard-amount"
              type="number"
              inputMode="numeric"
              defaultValue="10500"
              className="tabular-nums"
            />
          </div>
          <div className="space-y-2">
            <Label>세금 유형</Label>
            <Select defaultValue="business-income">
              <SelectTrigger>
                <SelectValue placeholder="세금 유형 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business-income">3.3%</SelectItem>
                <SelectItem value="social-insurance">4대보험</SelectItem>
                <SelectItem value="social-income-tax">4대보험+소득세</SelectItem>
                <SelectItem value="employment-insurance">고용보험만</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-pay-standard-night-rate">야간수당 배율</Label>
            <Input
              id="create-pay-standard-night-rate"
              type="number"
              step="0.1"
              min="1.5"
              defaultValue="1.5"
              className="tabular-nums"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-pay-standard-overtime-rate">연장수당 배율</Label>
            <Input
              id="create-pay-standard-overtime-rate"
              type="number"
              step="0.1"
              min="1.5"
              defaultValue="1.5"
              className="tabular-nums"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function RequiredMark({ hidden = false }: { hidden?: boolean }) {
  if (hidden) return null;
  return <span className="text-status-cancelled">*</span>;
}
