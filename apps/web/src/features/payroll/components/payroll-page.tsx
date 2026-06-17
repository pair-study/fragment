"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, FileText, ReceiptText, Search, Send } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  type PayrollRow,
  type PayrollStatus,
} from "./payroll-data";

type PayrollFilter = "all" | PayrollStatus;

const FILTERS: { value: PayrollFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "signature-pending", label: "서명 대기" },
  { value: "signed", label: "서명완료" },
  { value: "issued", label: "발급완료" },
];

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

export function PayrollPage() {
  const [filter, setFilter] = useState<PayrollFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const payrollSummary = useMemo(() => {
    const grossTotal = PAYROLL_ROWS.reduce((total, row) => total + getBaseGrossPay(row), 0);
    const netTotal = PAYROLL_ROWS.reduce(
      (total, row) => total + getNetPay(row, row.status === "signed" ? DEFAULT_EXTRA_ITEMS : []),
      0,
    );

    return {
      grossTotal,
      netTotal,
    };
  }, []);

  const filteredRows = useMemo(() => {
    return PAYROLL_ROWS.filter((row) => {
      const matchesFilter = filter === "all" || row.status === filter;
      const matchesSearch = [row.workerName, row.employeeNumber, row.payStandardName]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [filter, searchTerm]);

  return (
    <AdminPageShell
      title="급여정산"
      description="정산 기간의 근무 기록과 급여 기준을 바탕으로 근무자별 급여 명세서를 확인하고 발급해요."
      actions={
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Select defaultValue="2026-06">
            <SelectTrigger className="w-full sm:w-52" aria-label="정산 기간">
              <SelectValue placeholder="정산 기간 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026-06">2026년 6월</SelectItem>
              <SelectItem value="2026-05">2026년 5월</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative min-w-0 sm:min-w-80">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="이름, 사번, 급여 기준 검색"
              className="pl-9"
            />
          </div>
          <Button>
            <Send className="size-4" aria-hidden="true" />
            일괄 발급
          </Button>
        </div>
      }
      containerClassName="max-w-none"
      contentClassName="flex flex-col gap-6"
      descriptionClassName="max-w-3xl"
    >
      <PayrollOverview grossTotal={payrollSummary.grossTotal} netTotal={payrollSummary.netTotal} />

      <Card className="overflow-hidden">
        <div className="border-b border-border px-8 py-6">
          <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
            <div>
              <h2 className="text-balance text-2xl font-bold text-foreground">
                근무자별 정산 상태
              </h2>
              <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
                서명 여부와 발급 상태를 확인하고, 발급 가능한 명세서를 검토해요.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={cn(
                    "h-9 rounded-md border border-border px-3 text-sm font-medium transition-colors",
                    filter === item.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <PayrollTable rows={filteredRows} />
      </Card>
    </AdminPageShell>
  );
}

function PayrollOverview({ grossTotal, netTotal }: { grossTotal: number; netTotal: number }) {
  return (
    <div className="border-y border-border py-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewItem
          label="근무 기간"
          value="2026.06.01 - 06.30"
          description="이번 정산 대상 기간"
        />
        <OverviewItem label="지급일" value="2026.07.10" description="정산 주기 기준" />
        <OverviewItem
          label="예상 인건비"
          value={formatCurrency(grossTotal)}
          description="세전 급여 합계"
        />
        <OverviewItem
          label="실지급 예정액"
          value={formatCurrency(netTotal)}
          description="근무자에게 지급될 금액"
        />
      </div>
    </div>
  );
}

function OverviewItem({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 truncate text-2xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 truncate text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function PayrollTable({ rows }: { rows: PayrollRow[] }) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] table-auto">
          <thead className="bg-surface-secondary text-left">
            <tr className="border-b border-border">
              <TableHead className="pl-8">근무자</TableHead>
              <TableHead>급여 기준</TableHead>
              <TableHead className="text-right">확정 근무</TableHead>
              <TableHead className="text-right">세전 급여</TableHead>
              <TableHead className="text-right">추가 지급/공제</TableHead>
              <TableHead className="text-right">실지급액</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="pr-8 text-right">작업</TableHead>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const extraItems = row.status === "signed" ? DEFAULT_EXTRA_ITEMS : [];
              const extraEarning = getAdjustmentTotal(extraItems, "earning");
              const extraDeduction = getAdjustmentTotal(extraItems, "deduction");
              const actionLabel = row.status === "issued" ? "보기" : "발급";
              const disabled = row.status === "signature-pending";

              return (
                <tr key={row.id} className="border-b border-border hover:bg-accent/30">
                  <td className="min-w-44 px-8 py-4 align-top">
                    <p className="font-semibold text-foreground">{row.workerName}</p>
                    <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                      {row.employeeNumber}
                    </p>
                  </td>
                  <td className="min-w-44 px-4 py-4 align-top">
                    <Badge className="max-w-48 bg-status-confirmed-subtle text-status-confirmed">
                      <FileText className="size-3" aria-hidden="true" />
                      <span className="truncate">{row.payStandardName}</span>
                    </Badge>
                  </td>
                  <td className="min-w-28 px-4 py-4 text-right align-top">
                    <span className="text-sm font-medium tabular-nums text-foreground">
                      {row.confirmedHours}h
                    </span>
                  </td>
                  <td className="min-w-32 px-4 py-4 text-right align-top">
                    <span className="text-sm font-medium tabular-nums text-foreground">
                      {formatCurrency(getBaseGrossPay(row))}
                    </span>
                  </td>
                  <td className="min-w-36 px-4 py-4 text-right align-top">
                    <span className="text-sm tabular-nums text-muted-foreground">
                      +{formatCurrency(extraEarning)} / -{formatCurrency(extraDeduction)}
                    </span>
                  </td>
                  <td className="min-w-32 px-4 py-4 text-right align-top">
                    <p className="font-semibold tabular-nums text-foreground">
                      {formatCurrency(getNetPay(row, extraItems))}
                    </p>
                  </td>
                  <td className="min-w-28 px-4 py-4 align-top">
                    <PayrollStatusBadge status={row.status} />
                  </td>
                  <td className="min-w-28 px-8 py-4 text-right align-top">
                    {disabled ? (
                      <Button size="sm" disabled>
                        {actionLabel}
                      </Button>
                    ) : (
                      <Button
                        asChild
                        size="sm"
                        variant={row.status === "issued" ? "outline" : "default"}
                      >
                        <Link href={`/payroll/statements/${row.id}`}>{actionLabel}</Link>
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-8 py-4">
        <p className="text-sm text-muted-foreground">
          총 <span className="font-semibold tabular-nums text-foreground">{rows.length}</span>명
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            이전
          </Button>
          <Button variant="outline" size="sm">
            다음
          </Button>
        </div>
      </div>
    </>
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
