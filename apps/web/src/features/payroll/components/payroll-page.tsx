"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  ReceiptText,
  Search,
  Send,
  Settings2,
  WalletCards,
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

type PayrollStatus = "signature-pending" | "calculating" | "calculated" | "issued" | "blocked";
type PayrollFilter = "all" | PayrollStatus;

type PayrollRow = {
  id: string;
  workerName: string;
  employeeNumber: string;
  signedAt: string | null;
  templateName: string | null;
  status: PayrollStatus;
  grossPay: number | null;
  netPay: number | null;
  note: string;
};

type PayTemplate = {
  id: string;
  name: string;
  wageType: "시급" | "일급" | "월급";
  amount: number;
  taxType: string;
  period: string;
  payDay: string;
};

const PAYROLL_ROWS: PayrollRow[] = [
  {
    id: "payroll-1",
    workerName: "박지훈",
    employeeNumber: "STB-KD-0007",
    signedAt: null,
    templateName: null,
    status: "blocked",
    grossPay: null,
    netPay: null,
    note: "템플릿 지정 필요",
  },
  {
    id: "payroll-2",
    workerName: "김하은",
    employeeNumber: "STB-KD-0008",
    signedAt: "2026-06-16 09:12",
    templateName: "주간 시급제 기본",
    status: "calculated",
    grossPay: 1_284_000,
    netPay: 1_241_630,
    note: "발급 대기",
  },
  {
    id: "payroll-3",
    workerName: "이수민",
    employeeNumber: "STB-KD-0009",
    signedAt: "2026-06-16 10:48",
    templateName: "야간 수당 포함 템플릿",
    status: "calculated",
    grossPay: 1_427_500,
    netPay: 1_380_400,
    note: "추가 공제 검토",
  },
  {
    id: "payroll-4",
    workerName: "최유진",
    employeeNumber: "STB-KD-0010",
    signedAt: "2026-06-16 11:04",
    templateName: "주말 포함 시급제",
    status: "calculating",
    grossPay: null,
    netPay: null,
    note: "계산 중",
  },
  {
    id: "payroll-5",
    workerName: "정민재",
    employeeNumber: "STB-KD-0011",
    signedAt: "2026-06-15 22:31",
    templateName: "주간 시급제 기본",
    status: "issued",
    grossPay: 968_000,
    netPay: 936_050,
    note: "발급 완료",
  },
];

const PAY_TEMPLATES: PayTemplate[] = [
  {
    id: "template-1",
    name: "주간 시급제 기본",
    wageType: "시급",
    amount: 10_500,
    taxType: "3.3%",
    period: "매월 1일-말일",
    payDay: "익월 10일",
  },
  {
    id: "template-2",
    name: "야간 수당 포함 템플릿",
    wageType: "시급",
    amount: 12_000,
    taxType: "4대보험",
    period: "매월 1일-말일",
    payDay: "익월 10일",
  },
  {
    id: "template-3",
    name: "월급제 매니저",
    wageType: "월급",
    amount: 2_700_000,
    taxType: "4대보험+소득세",
    period: "매월 1일-말일",
    payDay: "익월 5일",
  },
];

const FILTERS: { value: PayrollFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "calculated", label: "발급 대기" },
  { value: "calculating", label: "계산 중" },
  { value: "blocked", label: "설정 필요" },
  { value: "issued", label: "발급 완료" },
];

const STATUS_META: Record<
  PayrollStatus,
  {
    label: string;
    description: string;
    badgeClassName: string;
    icon: typeof AlertCircle;
  }
> = {
  "signature-pending": {
    label: "서명 대기",
    description: "근무자 동의 전",
    badgeClassName: "bg-muted text-muted-foreground",
    icon: Clock3,
  },
  calculating: {
    label: "계산 중",
    description: "서명 후 자동 계산",
    badgeClassName: "bg-blue-50 text-blue-700",
    icon: Clock3,
  },
  calculated: {
    label: "발급 대기",
    description: "관리자 확인 필요",
    badgeClassName: "bg-primary/10 text-primary",
    icon: ReceiptText,
  },
  issued: {
    label: "발급 완료",
    description: "근무자 앱 조회 가능",
    badgeClassName: "bg-status-confirmed-subtle text-status-confirmed",
    icon: CheckCircle2,
  },
  blocked: {
    label: "설정 필요",
    description: "계산 전 조건 확인",
    badgeClassName: "bg-status-cancelled-subtle text-status-cancelled",
    icon: AlertCircle,
  },
};

export function PayrollPage() {
  const [filter, setFilter] = useState<PayrollFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRows = useMemo(() => {
    return PAYROLL_ROWS.filter((row) => {
      const matchesFilter = filter === "all" || row.status === filter;
      const matchesSearch = [row.workerName, row.employeeNumber, row.templateName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [filter, searchTerm]);

  return (
    <AdminPageShell
      title="급여정산"
      description="근무자 서명 후 자동 계산된 급여를 확인하고, 발급 대기 명세서를 처리해요."
      actions={
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <div className="relative min-w-0 sm:min-w-80">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="이름, 사번, 템플릿 검색"
              className="pl-9"
            />
          </div>
          <Button variant="outline">
            <Settings2 className="size-4" aria-hidden="true" />
            템플릿 관리
          </Button>
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
      <SettlementSummary />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="overflow-hidden">
          <div className="border-b border-border px-8 py-6">
            <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
              <div>
                <h2 className="text-balance text-2xl font-bold text-foreground">
                  근무자별 정산 상태
                </h2>
                <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
                  발급 가능한 명세서와 계산을 막는 조건을 같은 목록에서 확인해요.
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

        <aside className="flex flex-col gap-6">
          <PreIssueChecklist />
          <TemplatePanel />
        </aside>
      </div>

      <AuditLogPanel />
    </AdminPageShell>
  );
}

function SettlementSummary() {
  const calculatedCount = PAYROLL_ROWS.filter((row) => row.status === "calculated").length;
  const calculatingCount = PAYROLL_ROWS.filter((row) => row.status === "calculating").length;
  const issuedCount = PAYROLL_ROWS.filter((row) => row.status === "issued").length;
  const blockedCount = PAYROLL_ROWS.filter((row) => row.status === "blocked").length;

  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">2026년 6월 1차</Badge>
              <Badge className="bg-primary/10 text-primary">발급 준비 중</Badge>
            </div>
            <h2 className="mt-4 text-balance text-2xl font-bold text-foreground">
              2026-06-01 ~ 2026-06-15 정산
            </h2>
            <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
              지급일은 2026-06-25예요. 계산 완료 상태만 명세서 발급이 가능해요.
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[34rem]">
            <StatusMetric label="설정 필요" value={blockedCount} tone="danger" />
            <StatusMetric label="계산 중" value={calculatingCount} tone="neutral" />
            <StatusMetric label="발급 대기" value={calculatedCount} tone="primary" />
            <StatusMetric label="발급 완료" value={issuedCount} tone="success" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "danger" | "neutral" | "primary" | "success";
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-secondary px-4 py-3">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-bold tabular-nums",
          tone === "danger" && "text-status-cancelled",
          tone === "neutral" && "text-foreground",
          tone === "primary" && "text-primary",
          tone === "success" && "text-status-confirmed",
        )}
      >
        {value}명
      </p>
    </div>
  );
}

function PayrollTable({ rows }: { rows: PayrollRow[] }) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] table-fixed">
          <thead className="bg-surface-secondary text-left">
            <tr className="border-b border-border">
              <TableHead className="w-[22%] pl-8">근무자</TableHead>
              <TableHead className="w-[16%]">서명 여부</TableHead>
              <TableHead className="w-[18%]">계산 상태</TableHead>
              <TableHead className="w-[18%]">임금명세서 템플릿</TableHead>
              <TableHead className="w-[14%] text-right">실수령액</TableHead>
              <TableHead className="w-[12%] pr-8 text-right">처리</TableHead>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border hover:bg-accent/30">
                <td className="px-8 py-4 align-top">
                  <p className="truncate font-semibold text-foreground">{row.workerName}</p>
                  <p className="mt-1 truncate text-sm tabular-nums text-muted-foreground">
                    {row.employeeNumber}
                  </p>
                </td>
                <td className="px-4 py-4 align-top">
                  {row.signedAt ? (
                    <div>
                      <Badge variant="confirmed">
                        <CheckCircle2 className="size-3" aria-hidden="true" />
                        서명 완료
                      </Badge>
                      <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                        {row.signedAt}
                      </p>
                    </div>
                  ) : (
                    <Badge variant="secondary">
                      <Clock3 className="size-3" aria-hidden="true" />
                      서명 대기
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-4 align-top">
                  <PayrollStatusBadge status={row.status} />
                  <p className="mt-2 text-xs text-muted-foreground">{row.note}</p>
                </td>
                <td className="px-4 py-4 align-top">
                  {row.templateName ? (
                    <Badge className="max-w-full bg-status-confirmed-subtle text-status-confirmed">
                      <FileText className="size-3" aria-hidden="true" />
                      <span className="truncate">{row.templateName}</span>
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertCircle className="size-3" aria-hidden="true" />
                      미지정
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-4 text-right align-top">
                  {row.netPay ? (
                    <div>
                      <p className="font-semibold tabular-nums text-foreground">
                        {formatCurrency(row.netPay)}
                      </p>
                      <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                        총 {formatCurrency(row.grossPay ?? 0)}
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-8 py-4 text-right align-top">
                  <Button size="sm" disabled={row.status !== "calculated"}>
                    발급
                  </Button>
                </td>
              </tr>
            ))}
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

function PreIssueChecklist() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <WalletCards className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-balance text-lg font-bold text-foreground">발급 전 확인</h2>
            <p className="mt-1 text-pretty text-sm leading-6 text-muted-foreground">
              발급 버튼이 비활성화된 항목은 먼저 조건을 해결해야 해요.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <ChecklistItem
            title="임금명세서 템플릿 지정"
            description="미지정 근무자는 급여 계산이 차단돼요."
            tone="danger"
          />
          <ChecklistItem
            title="근무자 서명 완료"
            description="서명이 끝난 뒤 자동 계산이 시작돼요."
            tone="neutral"
          />
          <ChecklistItem
            title="추가 지급·공제 검토"
            description="발급 전까지만 추가 항목을 조정할 수 있어요."
            tone="primary"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ChecklistItem({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: "danger" | "neutral" | "primary";
}) {
  return (
    <div className="flex gap-3">
      <span
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
          tone === "danger" && "bg-status-cancelled-subtle text-status-cancelled",
          tone === "neutral" && "bg-muted text-muted-foreground",
          tone === "primary" && "bg-primary/10 text-primary",
        )}
      >
        <AlertCircle className="size-4" aria-hidden="true" />
      </span>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-pretty text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function TemplatePanel() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-balance text-lg font-bold text-foreground">임금명세서 템플릿</h2>
            <p className="mt-1 text-pretty text-sm leading-6 text-muted-foreground">
              계산 시점의 템플릿 값이 스냅샷으로 저장돼요.
            </p>
          </div>
          <Button size="sm" variant="outline">
            <Plus className="size-4" aria-hidden="true" />
            추가
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {PAY_TEMPLATES.map((template) => (
            <div key={template.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{template.name}</p>
                  <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                    {template.wageType} {formatCurrency(template.amount)}
                  </p>
                </div>
                <Badge variant="secondary">{template.taxType}</Badge>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  {template.period}
                </p>
                <p className="flex items-center gap-2">
                  <WalletCards className="size-4" aria-hidden="true" />
                  {template.payDay} 지급
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AuditLogPanel() {
  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-balance text-2xl font-bold text-foreground">계산 감사 로그</h2>
            <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
              계산 기준 스냅샷과 재계산 이력을 추적하는 영역이에요.
            </p>
          </div>
          <Select defaultValue="current">
            <SelectTrigger className="w-full lg:w-56" aria-label="감사 로그 기간">
              <SelectValue placeholder="기간 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">현재 정산 기간</SelectItem>
              <SelectItem value="previous">이전 정산 기간</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full min-w-[760px] table-fixed">
            <thead className="bg-surface-secondary text-left">
              <tr className="border-b border-border">
                <TableHead className="w-[22%] pl-5">시각</TableHead>
                <TableHead className="w-[18%]">대상</TableHead>
                <TableHead className="w-[22%]">이력</TableHead>
                <TableHead className="w-[38%] pr-5">기준</TableHead>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-5 py-4 text-sm tabular-nums text-foreground">2026-06-16 09:13</td>
                <td className="px-4 py-4 text-sm text-foreground">김하은</td>
                <td className="px-4 py-4 text-sm text-foreground">자동 계산 완료</td>
                <td className="px-5 py-4 text-sm text-muted-foreground">
                  주간 시급제 기본, 3.3%, 야간 1.5배, 연장 1.5배
                </td>
              </tr>
              <tr>
                <td className="px-5 py-4 text-sm tabular-nums text-foreground">2026-06-16 10:51</td>
                <td className="px-4 py-4 text-sm text-foreground">이수민</td>
                <td className="px-4 py-4 text-sm text-foreground">자동 계산 완료</td>
                <td className="px-5 py-4 text-sm text-muted-foreground">
                  야간 수당 포함 템플릿, 4대보험, 야간 1.5배, 연장 1.5배
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
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

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}
