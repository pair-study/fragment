"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  ReceiptText,
  Trash2,
} from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  DEFAULT_EXTRA_ITEMS,
  PAYROLL_ROWS,
  formatCurrency,
  getAdjustmentTotal,
  getBaseGrossPay,
  getNetPay,
  type PayrollExtraItem,
  type PayrollRow,
  type PayrollStatus,
} from "./payroll-data";

const STATUS_META: Record<
  PayrollStatus,
  {
    label: string;
    badgeClassName: string;
    icon: typeof Clock3;
  }
> = {
  "signature-pending": {
    label: "서명 대기",
    badgeClassName: "bg-muted text-muted-foreground",
    icon: Clock3,
  },
  signed: {
    label: "서명완료",
    badgeClassName: "bg-primary/10 text-primary",
    icon: CheckCircle2,
  },
  issued: {
    label: "발급완료",
    badgeClassName: "bg-status-confirmed-subtle text-status-confirmed",
    icon: ReceiptText,
  },
};

type PayrollStatementPageProps = {
  statementId: string;
};

export function PayrollStatementPage({ statementId }: PayrollStatementPageProps) {
  const statement = PAYROLL_ROWS.find((row) => row.id === statementId) ?? null;
  const [extraItems, setExtraItems] = useState<PayrollExtraItem[]>(() =>
    statement?.status === "signature-pending"
      ? []
      : DEFAULT_EXTRA_ITEMS.map((item) => ({ ...item })),
  );

  const selectedRow = statement ?? PAYROLL_ROWS[0];
  const readonly = selectedRow.status === "issued";
  const canIssue = selectedRow.status === "signed";
  const earningTotal = getAdjustmentTotal(extraItems, "earning");
  const deductionTotal = getAdjustmentTotal(extraItems, "deduction");
  const grossPay = getBaseGrossPay(selectedRow) + earningTotal;
  const netPay = getNetPay(selectedRow, extraItems);

  const progressStep = useMemo(() => {
    if (selectedRow.status === "issued") return 3;
    if (selectedRow.status === "signed") return 2;
    return 1;
  }, [selectedRow.status]);

  return (
    <AdminPageShell
      title="급여 명세서"
      description="계산된 명세서와 계산 근거를 확인하고, 이번 정산에만 적용할 추가 지급·공제를 조정해요."
      actions={
        <Button asChild variant="outline">
          <Link href="/payroll">
            <ArrowLeft className="size-4" aria-hidden="true" />
            목록으로
          </Link>
        </Button>
      }
      containerClassName="max-w-none"
      contentClassName="grid gap-6 xl:grid-cols-[minmax(34rem,1fr)_minmax(32rem,0.78fr)]"
      descriptionClassName="max-w-3xl"
    >
      <PayrollRecordPanel selectedId={selectedRow.id} />

      <section className="min-w-0">
        {statement ? (
          <Card className="overflow-hidden">
            <div className="border-b border-border px-8 py-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">명세서 검토</p>
                  <h2 className="mt-1 text-balance text-2xl font-bold text-foreground">
                    {selectedRow.workerName}
                  </h2>
                  <p className="mt-2 text-sm tabular-nums text-muted-foreground">
                    {selectedRow.employeeNumber} · 2026.06.01 - 06.30
                  </p>
                </div>
                <PayrollStatusBadge status={selectedRow.status} />
              </div>

              <StatementProgress currentStep={progressStep} />
            </div>

            <CardContent className="space-y-8 p-8">
              <PaystubPreview
                row={selectedRow}
                grossPay={grossPay}
                netPay={netPay}
                earningTotal={earningTotal}
                deductionTotal={deductionTotal}
              />

              <CalculationBasis row={selectedRow} />

              <ExtraAdjustmentEditor
                readonly={readonly}
                items={extraItems}
                onChange={setExtraItems}
              />

              <div className="rounded-lg border border-border bg-surface-secondary p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatementMetric label="세전 합계" value={formatCurrency(grossPay)} />
                  <StatementMetric
                    label="총 공제"
                    value={formatCurrency(selectedRow.taxDeduction + deductionTotal)}
                  />
                  <StatementMetric label="실지급액" value={formatCurrency(netPay)} strong />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
                <Button asChild variant="outline">
                  <Link href="/payroll">목록으로</Link>
                </Button>
                {readonly ? (
                  <Button type="button" disabled>
                    발급 완료된 명세서
                  </Button>
                ) : (
                  <Button type="button" disabled={!canIssue}>
                    <Check className="size-4" aria-hidden="true" />
                    최종 발급 완료
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8">
              <h2 className="text-balance text-2xl font-bold text-foreground">
                명세서를 찾을 수 없어요
              </h2>
              <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
                급여정산 목록에서 다시 명세서를 선택해 주세요.
              </p>
              <Button asChild className="mt-6">
                <Link href="/payroll">급여정산 목록으로</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </AdminPageShell>
  );
}

function PayrollRecordPanel({ selectedId }: { selectedId: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border px-8 py-6">
        <h2 className="text-balance text-2xl font-bold text-foreground">근무자별 정산 상태</h2>
        <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
          다른 근무자의 명세서로 바로 이동할 수 있어요.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] table-auto">
          <thead className="bg-surface-secondary text-left">
            <tr className="border-b border-border">
              <TableHead className="pl-8">근무자</TableHead>
              <TableHead className="text-right">세전 급여</TableHead>
              <TableHead className="text-right">실지급액</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="pr-8 text-right">작업</TableHead>
            </tr>
          </thead>
          <tbody>
            {PAYROLL_ROWS.map((row) => {
              const extraItems = row.status === "signature-pending" ? [] : DEFAULT_EXTRA_ITEMS;
              const disabled = row.status === "signature-pending";
              const active = row.id === selectedId;

              return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border hover:bg-accent/30",
                    active && "bg-primary/5",
                  )}
                >
                  <td className="min-w-44 px-8 py-4 align-top">
                    <p className="font-semibold text-foreground">{row.workerName}</p>
                    <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                      {row.employeeNumber}
                    </p>
                  </td>
                  <td className="min-w-32 px-4 py-4 text-right align-top">
                    <span className="text-sm font-medium tabular-nums text-foreground">
                      {formatCurrency(getBaseGrossPay(row))}
                    </span>
                  </td>
                  <td className="min-w-32 px-4 py-4 text-right align-top">
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(getNetPay(row, extraItems))}
                    </span>
                  </td>
                  <td className="min-w-28 px-4 py-4 align-top">
                    <PayrollStatusBadge status={row.status} />
                  </td>
                  <td className="min-w-28 px-8 py-4 text-right align-top">
                    {disabled ? (
                      <Button size="sm" disabled>
                        발급
                      </Button>
                    ) : (
                      <Button
                        asChild
                        size="sm"
                        variant={row.status === "issued" ? "outline" : "default"}
                      >
                        <Link href={`/payroll/statements/${row.id}`}>
                          {row.status === "issued" ? "보기" : "발급"}
                        </Link>
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function StatementProgress({ currentStep }: { currentStep: number }) {
  const steps = ["계산 완료", "검토 중", "발급 완료"];

  return (
    <div className="mt-6 grid grid-cols-3 gap-3">
      {steps.map((step, index) => {
        const number = index + 1;
        const complete = number <= currentStep;

        return (
          <div key={step} className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  complete
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {complete ? <Check className="size-4" aria-hidden="true" /> : number}
              </span>
              <span className="truncate text-sm font-medium text-foreground">{step}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PaystubPreview({
  row,
  grossPay,
  netPay,
  earningTotal,
  deductionTotal,
}: {
  row: PayrollRow;
  grossPay: number;
  netPay: number;
  earningTotal: number;
  deductionTotal: number;
}) {
  return (
    <section className="rounded-xl border border-dashed border-border bg-card p-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">급여 명세서 미리보기</p>
          <h3 className="mt-2 text-balance text-2xl font-bold text-foreground">{row.workerName}</h3>
          <p className="mt-1 text-sm tabular-nums text-muted-foreground">2026.06.01 - 06.30</p>
        </div>
        <p className="text-sm tabular-nums text-muted-foreground">ID: ILG-2026-{row.id}</p>
      </div>

      <div className="mt-5 space-y-4">
        <PaystubLine label={`기본급 (${row.confirmedHours}h)`} value={row.basePay} />
        <PaystubLine label="연장·야간 수당" value={row.overtimePay} />
        <PaystubLine label="기본 수당" value={row.baseAllowance} />
        <PaystubLine label="추가 지급" value={earningTotal} />
        <PaystubLine label="세전 합계" value={grossPay} strong />
        <PaystubLine label="세금/보험 공제" value={-row.taxDeduction} />
        <PaystubLine label="추가 공제" value={-deductionTotal} />
        <PaystubLine label="실지급액" value={netPay} strong />
      </div>
    </section>
  );
}

function PaystubLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={cn("text-sm text-muted-foreground", strong && "font-semibold text-foreground")}
      >
        {label}
      </span>
      <span className={cn("text-sm tabular-nums text-foreground", strong && "font-bold")}>
        {value < 0 ? "-" : ""}
        {formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}

function CalculationBasis({ row }: { row: PayrollRow }) {
  return (
    <section>
      <h3 className="text-balance text-lg font-bold text-foreground">계산 근거</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <BasisItem label="급여 기준" value={row.payStandardName} icon={FileText} />
        <BasisItem label="확정 근무" value={`${row.confirmedHours}h`} />
        <BasisItem label="기본급" value={formatCurrency(row.basePay)} />
        <BasisItem label="연장·야간 수당" value={formatCurrency(row.overtimePay)} />
        <BasisItem label="기본 수당" value={formatCurrency(row.baseAllowance)} />
        <BasisItem label="세금/보험 공제" value={`-${formatCurrency(row.taxDeduction)}`} />
      </div>
    </section>
  );
}

function BasisItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof FileText;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-secondary px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
        {label}
      </p>
      <p className="mt-2 truncate text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function ExtraAdjustmentEditor({
  readonly,
  items,
  onChange,
}: {
  readonly: boolean;
  items: PayrollExtraItem[];
  onChange: (items: PayrollExtraItem[]) => void;
}) {
  const addItem = (type: PayrollExtraItem["type"]) => {
    onChange([
      ...items,
      {
        id: `extra-${Date.now()}-${type}`,
        type,
        label: "",
        amount: 0,
      },
    ]);
  };

  const updateItem = (id: string, patch: Partial<PayrollExtraItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <section className="overflow-hidden rounded-lg border border-border">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-balance text-lg font-bold text-foreground">추가 지급·공제</h3>
          <p className="mt-1 text-pretty text-sm leading-6 text-muted-foreground">
            입력값이 바뀌면 명세서의 최종 금액이 즉시 갱신돼요.
          </p>
        </div>
        {!readonly ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => addItem("earning")}>
              <Plus className="size-4" aria-hidden="true" />
              지급 추가
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => addItem("deduction")}>
              <Plus className="size-4" aria-hidden="true" />
              공제 추가
            </Button>
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] table-fixed">
          <thead className="bg-surface-secondary text-left">
            <tr className="border-b border-border">
              <TableHead className="w-[18%] pl-5">구분</TableHead>
              <TableHead className="w-[44%]">항목명</TableHead>
              <TableHead className="w-[26%] text-right">금액</TableHead>
              <TableHead className="w-[12%] pr-5 text-right">삭제</TableHead>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-b-0">
                <td className="px-5 py-4 align-top">
                  <Select
                    value={item.type}
                    onValueChange={(value) =>
                      updateItem(item.id, { type: value as PayrollExtraItem["type"] })
                    }
                    disabled={readonly}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="구분" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="earning">추가 지급</SelectItem>
                      <SelectItem value="deduction">추가 공제</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-4 align-top">
                  <Input
                    value={item.label}
                    disabled={readonly}
                    aria-label="추가 지급·공제 항목명"
                    onChange={(event) => updateItem(item.id, { label: event.target.value })}
                  />
                </td>
                <td className="px-4 py-4 align-top">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={item.amount}
                    disabled={readonly}
                    aria-label="추가 지급·공제 금액"
                    className="text-right tabular-nums"
                    onChange={(event) =>
                      updateItem(item.id, { amount: Number(event.target.value || 0) })
                    }
                  />
                </td>
                <td className="px-5 py-4 text-right align-top">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="항목 삭제"
                    disabled={readonly}
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatementMetric({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 truncate text-lg font-bold tabular-nums text-foreground",
          strong && "text-xl",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function PayrollStatusBadge({ status }: { status: PayrollStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <Badge className={meta.badgeClassName}>
      <Icon className="size-3" aria-hidden="true" />
      {meta.label}
    </Badge>
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
