"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  FileText,
  Lock,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
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

import { type ClosureRule, OrganizationClosureSection } from "./organization-closure-section";
import { GpsRadiusField } from "./gps-radius-field";
import { type WorkType, WorkTypeField } from "./work-type-field";
import { cn } from "@/lib/utils";

const WORK_TYPE_LABEL: Record<WorkType, string> = {
  fixed: "고정 근무",
  flexible: "신청 근무",
  both: "고정 + 신청 근무",
};

const CURRENT_ORG = {
  businessNumber: "123-45-67890",
  name: "스타벅스 강남점",
  roadAddress: "서울 강남구 테헤란로 14",
  addressDetail: "",
  gpsRadius: 120,
  workType: "flexible" as WorkType,
  payrollPeriodStartMonth: "current",
  payrollPeriodStartDay: "1",
  payrollPeriodEndMonth: "current",
  payrollPeriodEndDay: "31",
  payrollPayMonth: "next",
  payrollPayDay: "10",
  payStandards: [
    {
      id: "standard-weekday",
      name: "주간 시급제 기본",
      wageType: "시급",
      amount: "10,500원",
      taxType: "3.3%",
      nightRate: "1.5배",
      overtimeRate: "1.5배",
    },
    {
      id: "standard-weekend",
      name: "주말 포함 시급제",
      wageType: "시급",
      amount: "12,000원",
      taxType: "4대보험",
      nightRate: "1.5배",
      overtimeRate: "1.5배",
    },
  ],
  closures: [
    { id: "weekly-sunday", type: "weekly" as const, value: "일요일", label: "정기 휴무" },
    {
      id: "specific-lunar-new-year",
      type: "specific" as const,
      value: "2026-02-17",
      label: "설날 연휴",
    },
  ] satisfies ClosureRule[],
};

const PAYROLL_MONTH_OPTIONS = [
  { value: "previous", label: "전월" },
  { value: "current", label: "당월" },
  { value: "next", label: "익월" },
];

const PAYROLL_MONTH_LABEL: Record<string, string> = {
  previous: "전월",
  current: "당월",
  next: "익월",
};

export function OrganizationSettingsPage() {
  const [basicEditing, setBasicEditing] = useState(false);
  const [payStandardEditing, setPayStandardEditing] = useState(false);
  const [closureEditing, setClosureEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [name, setName] = useState(CURRENT_ORG.name);
  const [roadAddress, setRoadAddress] = useState(CURRENT_ORG.roadAddress);
  const [addressDetail, setAddressDetail] = useState(CURRENT_ORG.addressDetail);
  const [radius, setRadius] = useState(CURRENT_ORG.gpsRadius);
  const [workType, setWorkType] = useState<WorkType>(CURRENT_ORG.workType);
  const [payrollPeriodStartMonth, setPayrollPeriodStartMonth] = useState(
    CURRENT_ORG.payrollPeriodStartMonth,
  );
  const [payrollPeriodStartDay, setPayrollPeriodStartDay] = useState(
    CURRENT_ORG.payrollPeriodStartDay,
  );
  const [payrollPeriodEndMonth, setPayrollPeriodEndMonth] = useState(
    CURRENT_ORG.payrollPeriodEndMonth,
  );
  const [payrollPeriodEndDay, setPayrollPeriodEndDay] = useState(CURRENT_ORG.payrollPeriodEndDay);
  const [payrollPayMonth, setPayrollPayMonth] = useState(CURRENT_ORG.payrollPayMonth);
  const [payrollPayDay, setPayrollPayDay] = useState(CURRENT_ORG.payrollPayDay);
  const [closures, setClosures] = useState<ClosureRule[]>(CURRENT_ORG.closures);

  return (
    <AdminPageShell
      title="조직 관리"
      description="현재 선택된 조직의 기본 정보, 출퇴근 위치 기준, 근무 유형, 휴무일을 관리해요."
      contentClassName="flex flex-col gap-6"
    >
      <Card>
        <CardContent className="p-8">
          <SectionHeader
            title="기본 정보"
            editing={basicEditing}
            onEdit={() => setBasicEditing(true)}
            onSave={() => setBasicEditing(false)}
            onCancel={() => setBasicEditing(false)}
          />

          {basicEditing ? (
            <div className="mt-6 space-y-6">
              <ReadonlyField label="사업자등록번호" value={CURRENT_ORG.businessNumber} locked />

              <div className="space-y-2">
                <Label htmlFor="edit-organization-name">조직명</Label>
                <Input
                  id="edit-organization-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-road-address">주소</Label>
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <Input
                    id="edit-road-address"
                    readOnly
                    value={roadAddress}
                    className="bg-surface-secondary"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    onClick={() => setRoadAddress("서울 강남구 테헤란로 142")}
                  >
                    <Search className="size-4" aria-hidden="true" />
                    주소 변경
                  </Button>
                </div>
                <Input
                  placeholder="상세주소 (동·층·호)"
                  value={addressDetail}
                  onChange={(event) => setAddressDetail(event.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <Label>GPS 허용 반경</Label>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    이 반경 안에서만 출퇴근 체크가 인정돼요. 50m~300m 범위에서 설정할 수 있어요.
                  </p>
                </div>
                <GpsRadiusField value={radius} hasAddress onChange={setRadius} />
              </div>

              <div className="space-y-3">
                <div>
                  <Label>근무 유형</Label>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    이 조직에서 근무를 배정하는 방식을 선택하세요.
                  </p>
                </div>
                <WorkTypeField value={workType} onChange={setWorkType} />
              </div>

              <div className="space-y-3">
                <div>
                  <Label>정산 주기</Label>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    기준월과 일자를 조합해 정산 기간과 지급일을 지정하세요.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <PayrollDayField
                    id="payroll-period-start-day"
                    label="정산 시작일"
                    monthValue={payrollPeriodStartMonth}
                    onMonthChange={setPayrollPeriodStartMonth}
                    value={payrollPeriodStartDay}
                    onChange={setPayrollPeriodStartDay}
                  />
                  <PayrollDayField
                    id="payroll-period-end-day"
                    label="정산 종료일"
                    monthValue={payrollPeriodEndMonth}
                    onMonthChange={setPayrollPeriodEndMonth}
                    value={payrollPeriodEndDay}
                    onChange={setPayrollPeriodEndDay}
                  />
                  <PayrollDayField
                    id="payroll-pay-day"
                    label="지급일"
                    monthValue={payrollPayMonth}
                    onMonthChange={setPayrollPayMonth}
                    value={payrollPayDay}
                    onChange={setPayrollPayDay}
                  />
                </div>
              </div>
            </div>
          ) : (
            <dl className="mt-6 space-y-4">
              <ReadonlyField label="사업자등록번호" value={CURRENT_ORG.businessNumber} locked />
              <ReadonlyField label="조직명" value={name} />
              <ReadonlyField
                label="주소"
                value={[roadAddress, addressDetail].filter(Boolean).join(", ")}
              />
              <ReadonlyField label="GPS 허용 반경" value={`${radius}m`} />
              <ReadonlyField label="근무 유형" value={WORK_TYPE_LABEL[workType]} />
              <ReadonlyField
                label="정산 주기"
                value={`${formatPayrollDay(payrollPeriodStartMonth, payrollPeriodStartDay)}-${formatPayrollDay(payrollPeriodEndMonth, payrollPeriodEndDay)} / ${formatPayrollDay(payrollPayMonth, payrollPayDay)} 지급`}
              />
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <SectionHeader
            title="급여 기준"
            editing={payStandardEditing}
            onEdit={() => setPayStandardEditing(true)}
            onSave={() => setPayStandardEditing(false)}
            onCancel={() => setPayStandardEditing(false)}
          />

          {payStandardEditing ? (
            <div className="mt-6 space-y-5">
              <PayStandardEditCard />
              <Button type="button" variant="outline">
                <Plus className="size-4" aria-hidden="true" />
                급여 기준 추가
              </Button>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-lg border border-border">
              <table className="w-full min-w-[820px] table-fixed">
                <thead className="bg-surface-secondary text-left">
                  <tr className="border-b border-border">
                    <TableHead className="w-[28%] pl-5">이름</TableHead>
                    <TableHead className="w-[14%]">급여 타입</TableHead>
                    <TableHead className="w-[18%]">기준 금액</TableHead>
                    <TableHead className="w-[16%]">세금 유형</TableHead>
                    <TableHead className="w-[24%] pr-5">수당 배율</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {CURRENT_ORG.payStandards.map((standard) => (
                    <tr key={standard.id} className="border-b border-border last:border-b-0">
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
                          <span className="font-semibold text-foreground">{standard.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <Badge variant="secondary">{standard.wageType}</Badge>
                      </td>
                      <td className="px-4 py-4 align-top text-sm tabular-nums text-foreground">
                        {standard.amount}
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-foreground">
                        {standard.taxType}
                      </td>
                      <td className="px-5 py-4 align-top text-sm text-muted-foreground">
                        야간 {standard.nightRate} · 연장 {standard.overtimeRate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {closureEditing ? (
        <div>
          <div className="mb-3 flex items-center justify-end gap-2">
            <Button type="button" size="sm" onClick={() => setClosureEditing(false)}>
              <Check className="size-4" aria-hidden="true" />
              저장
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setClosureEditing(false)}
            >
              <X className="size-4" aria-hidden="true" />
              취소
            </Button>
          </div>
          <OrganizationClosureSection rules={closures} onChange={setClosures} />
        </div>
      ) : (
        <Card>
          <CardContent className="p-8">
            <SectionHeader
              title="조직 휴무일"
              editing={false}
              onEdit={() => setClosureEditing(true)}
              onSave={() => setClosureEditing(false)}
              onCancel={() => setClosureEditing(false)}
            />

            {closures.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">등록된 휴무일이 없어요.</p>
            ) : (
              <ul className="mt-6 space-y-2">
                {closures.map((rule) => (
                  <li key={rule.id} className="flex items-center gap-2 text-sm text-foreground">
                    <CalendarDays
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span>{formatClosureRule(rule)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-destructive/30">
        <CardContent className="flex flex-col gap-5 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-destructive">조직 삭제</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              재직 중인 근무자가 있으면 삭제할 수 없어요. 근태·급여 데이터는 3년간 보존돼요.
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={() => setDeleteDialogOpen(true)}
          >
            조직 삭제
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex size-10 items-center justify-center rounded-full bg-status-cancelled-subtle text-status-cancelled">
              <AlertTriangle className="size-5" aria-hidden="true" />
            </div>
            <AlertDialogTitle>{name} 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              조직을 삭제하면 복구할 수 없습니다. 삭제 전 재직 중인 근무자를 모두 퇴사 처리해야
              합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction>조직 삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}

function formatClosureRule(rule: ClosureRule) {
  if (rule.type === "weekly") return `매주 ${rule.value} - ${rule.label}`;
  if (rule.type === "biweekly") return `격주 ${rule.value} - ${rule.label}`;
  return `${rule.value} - ${rule.label}`;
}

function formatPayrollDay(month: string, day: string) {
  return `${PAYROLL_MONTH_LABEL[month]} ${day}일`;
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

function PayStandardEditCard() {
  return (
    <div className="rounded-lg border border-border bg-surface-secondary p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pay-standard-name">이름</Label>
          <Input id="pay-standard-name" defaultValue="주간 시급제 기본" />
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
          <Label htmlFor="pay-standard-amount">기준 금액</Label>
          <Input
            id="pay-standard-amount"
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
          <Label htmlFor="night-rate">야간수당 배율</Label>
          <Input
            id="night-rate"
            type="number"
            step="0.1"
            min="1.5"
            defaultValue="1.5"
            className="tabular-nums"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="overtime-rate">연장수당 배율</Label>
          <Input
            id="overtime-rate"
            type="number"
            step="0.1"
            min="1.5"
            defaultValue="1.5"
            className="tabular-nums"
          />
        </div>
      </div>
    </div>
  );
}

function TableHead({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className={cn("px-4 py-3 text-sm font-semibold text-muted-foreground", className)}
    >
      {children}
    </th>
  );
}

function SectionHeader({
  title,
  editing,
  onEdit,
  onSave,
  onCancel,
}: {
  title: string;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {editing ? (
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={onSave}>
            <Check className="size-4" aria-hidden="true" />
            저장
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            <X className="size-4" aria-hidden="true" />
            취소
          </Button>
        </div>
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="size-4" aria-hidden="true" />
          수정
        </Button>
      )}
    </div>
  );
}

function ReadonlyField({
  label,
  value,
  locked = false,
}: {
  label: string;
  value: string;
  locked?: boolean;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2 text-sm text-foreground">
        <span className="min-w-0 truncate">{value || "-"}</span>
        {locked ? (
          <>
            <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Badge variant="confirmed" className="shrink-0">
              <ShieldCheck className="size-3" aria-hidden="true" />
              진위 확인 완료
            </Badge>
          </>
        ) : null}
      </dd>
    </div>
  );
}
