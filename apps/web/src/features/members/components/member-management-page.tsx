"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  FileText,
  KeyRound,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserX,
  X,
} from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

const ORG_CODE = "STB-KD";

const PAYROLL_TEMPLATES = [
  "주간 시급제 기본",
  "주말 포함 시급제",
  "야간 수당 포함 템플릿",
] as const;

const ACTIVE_WORKERS: WorkerRecord[] = [
  {
    id: "worker-1",
    name: "박지훈",
    employeeNumberSuffix: "0007",
    joinedAt: "2026-06-14",
    phone: "010-4811-1182",
    scheduleType: "fixed",
    payTemplate: "",
    verificationStatus: "unverified",
    employmentStatus: "setup-needed",
    hasHistory: false,
    fixedPattern: {
      days: ["mon", "tue", "thu", "fri"],
      start: "09:00",
      end: "18:00",
      breakStart: "13:00",
      breakEnd: "14:00",
    },
    applyTiming: "다음 주",
  },
  {
    id: "worker-2",
    name: "김하은",
    employeeNumberSuffix: "0008",
    joinedAt: "2026-06-10",
    phone: "010-2287-4143",
    scheduleType: "flexible",
    payTemplate: "주간 시급제 기본",
    verificationStatus: "verified",
    employmentStatus: "active",
    hasHistory: true,
    applyTiming: "즉시 다음 근무",
  },
  {
    id: "worker-3",
    name: "이수민",
    employeeNumberSuffix: "0009",
    joinedAt: "2026-05-02",
    phone: "010-9123-5581",
    scheduleType: "fixed",
    payTemplate: "야간 수당 포함 템플릿",
    verificationStatus: "verified",
    employmentStatus: "active",
    hasHistory: true,
    fixedPattern: {
      days: ["tue", "wed", "thu", "fri"],
      start: "10:00",
      end: "19:00",
      breakStart: "14:00",
      breakEnd: "15:00",
    },
    applyTiming: "다음 달",
  },
];

const RETIRED_WORKERS: RetiredWorkerRecord[] = [
  {
    id: "retired-1",
    name: "최민서",
    employeeNumberSuffix: "0003",
    joinedAt: "2025-11-03",
    resignedAt: "2026-05-31",
    scheduleType: "flexible",
    payTemplate: "주말 포함 시급제",
  },
];

const NEW_WORKER_DRAFT: WorkerDraft = {
  name: "",
  joinedAt: "2026-06-17",
  phone: "",
  scheduleType: "flexible",
  payTemplate: "",
  fixedPattern: createDefaultFixedPattern(),
  applyTiming: "즉시 다음 근무",
  customApplyDate: "",
};

type MemberManagementPageProps = {
  view?: "list" | "new" | "detail";
  workerId?: string;
};

type WorkerTab = "active" | "retired";
type WorkerMode = "view" | "edit" | "create";
type ScheduleType = "fixed" | "flexible";
type VerificationStatus = "verified" | "unverified";
type EmploymentStatus = "active" | "setup-needed";
type DayId = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export function MemberManagementPage({ view = "list", workerId }: MemberManagementPageProps) {
  const [workerTab, setWorkerTab] = useState<WorkerTab>("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState<WorkerMode>(view === "new" ? "create" : "view");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resignDialogOpen, setResignDialogOpen] = useState(false);
  const selectedWorker = ACTIVE_WORKERS.find((worker) => worker.id === workerId);
  const [draft, setDraft] = useState<WorkerDraft>(() =>
    view === "new" ? NEW_WORKER_DRAFT : createDraftFromWorker(selectedWorker ?? null),
  );

  const activeWorkers = useMemo(() => {
    return ACTIVE_WORKERS.filter((worker) =>
      [worker.name, worker.employeeNumberSuffix, worker.phone, worker.payTemplate]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm]);

  const retiredWorkers = useMemo(() => {
    return RETIRED_WORKERS.filter((worker) =>
      [worker.name, worker.employeeNumberSuffix, worker.payTemplate]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm]);

  const isListView = view === "list";

  return (
    <AdminPageShell
      title="인력관리"
      description="근무자 목록을 확인하고, 자동 발급 사번과 인증 여부, 근무 설정, 퇴사·삭제 처리를 관리해요."
      actions={
        isListView ? (
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <div className="relative min-w-0 sm:min-w-80">
              <Search
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="이름, 사번, 연락처 검색"
                className="pl-9"
              />
            </div>
            <Button asChild>
              <Link href="/members/new">
                <Plus className="size-4" aria-hidden="true" />
                근무자 등록
              </Link>
            </Button>
          </div>
        ) : (
          <Button asChild variant="outline">
            <Link href="/members">
              <ArrowLeft className="size-4" aria-hidden="true" />
              목록으로
            </Link>
          </Button>
        )
      }
      containerClassName="max-w-none"
      contentClassName="flex flex-col gap-6"
      descriptionClassName="max-w-3xl"
    >
      {view === "list" ? (
        <MemberList
          workerTab={workerTab}
          setWorkerTab={setWorkerTab}
          activeWorkers={activeWorkers}
          retiredWorkers={retiredWorkers}
        />
      ) : null}

      {view === "new" ? (
        <WorkerEditor
          title="근무자 등록"
          eyebrow="신규 등록"
          mode="create"
          draft={draft}
          setDraft={setDraft}
          onSaveDisabled={!canSaveWorker(draft)}
        />
      ) : null}

      {view === "detail" && selectedWorker ? (
        <WorkerDetail
          worker={selectedWorker}
          mode={mode}
          draft={draft}
          setDraft={setDraft}
          setMode={setMode}
          onDelete={() => setDeleteDialogOpen(true)}
          onResign={() => setResignDialogOpen(true)}
        />
      ) : null}

      {view === "detail" && !selectedWorker ? (
        <Card className="p-8">
          <h2 className="text-balance text-xl font-bold text-foreground">
            근무자를 찾을 수 없어요
          </h2>
          <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
            목록에서 다시 근무자를 선택해 주세요.
          </p>
          <Button asChild className="mt-6">
            <Link href="/members">목록으로</Link>
          </Button>
        </Card>
      ) : null}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>등록 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              근무 이력이 없는 잘못된 등록만 삭제할 수 있어요. 삭제하면 아직 인증되지 않은 사번도
              함께 회수돼요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resignDialogOpen} onOpenChange={setResignDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>퇴사 처리</AlertDialogTitle>
            <AlertDialogDescription>
              퇴사 처리 후에는 스케줄 편성 대상에서 제외돼요. 근태·급여 이력은 3년간 보존되고 퇴직
              탭에서 계속 조회할 수 있어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              퇴사 처리
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}

function MemberList({
  workerTab,
  setWorkerTab,
  activeWorkers,
  retiredWorkers,
}: {
  workerTab: WorkerTab;
  setWorkerTab: (tab: WorkerTab) => void;
  activeWorkers: WorkerRecord[];
  retiredWorkers: RetiredWorkerRecord[];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border px-8 py-6">
        <div>
          <div>
            <h2 className="text-balance text-2xl font-bold text-foreground">근무자</h2>
            <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
              등록, 인증 여부, 근무 설정 상태를 한눈에 확인해요.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex items-center gap-5 border-b border-border">
              <ListTabButton active={workerTab === "active"} onClick={() => setWorkerTab("active")}>
                재직 중 {ACTIVE_WORKERS.length}
              </ListTabButton>
              <ListTabButton
                active={workerTab === "retired"}
                onClick={() => setWorkerTab("retired")}
              >
                퇴직 {RETIRED_WORKERS.length}
              </ListTabButton>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect label="근무 유형" options={["전체", "고정 근무", "신청 근무"]} />
              <FilterSelect
                label="인증 여부"
                options={["전체", "인증", "미인증"]}
                disabled={workerTab === "retired"}
              />
              <FilterSelect
                label="설정 상태"
                options={["전체", "설정 완료", "설정 필요"]}
                disabled={workerTab === "retired"}
              />
            </div>
          </div>
        </div>
      </div>

      {workerTab === "active" ? (
        <ActiveWorkerTable workers={activeWorkers} />
      ) : (
        <RetiredWorkerTable workers={retiredWorkers} />
      )}
    </Card>
  );
}

function ActiveWorkerTable({ workers }: { workers: WorkerRecord[] }) {
  const router = useRouter();

  const openWorker = (workerId: string) => {
    router.push(`/members/${workerId}`);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] table-fixed">
          <thead className="bg-surface-secondary text-left">
            <tr className="border-b border-border">
              <TableHead className="w-[25%] pl-8">이름 / 사번</TableHead>
              <TableHead className="w-[12%]">인증 여부</TableHead>
              <TableHead className="w-[13%]">근무 유형</TableHead>
              <TableHead className="w-[22%]">임금명세서 템플릿</TableHead>
              <TableHead className="w-[13%]">입사일</TableHead>
              <TableHead className="w-[15%] pr-8">상태</TableHead>
            </tr>
          </thead>
          <tbody>
            {workers.map((worker) => (
              <tr
                key={worker.id}
                role="link"
                tabIndex={0}
                aria-label={`${worker.name} 상세 보기`}
                className="cursor-pointer border-b border-border transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                onClick={() => openWorker(worker.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openWorker(worker.id);
                  }
                }}
              >
                <td className="px-8 py-4 align-top">
                  <div className="min-w-0">
                    <span className="block truncate font-semibold text-foreground">
                      {worker.name}
                    </span>
                    <span className="mt-1 block truncate text-sm tabular-nums text-muted-foreground">
                      {ORG_CODE}-{worker.employeeNumberSuffix}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 align-top">
                  <VerificationBadge status={worker.verificationStatus} />
                </td>
                <td className="whitespace-nowrap px-4 py-4 align-top text-sm text-foreground">
                  {SCHEDULE_TYPE_LABEL[worker.scheduleType]}
                </td>
                <td className="px-4 py-4 align-top">
                  <PayrollTemplateBadge template={worker.payTemplate} />
                </td>
                <td className="whitespace-nowrap px-4 py-4 align-top text-sm tabular-nums text-foreground">
                  {worker.joinedAt}
                </td>
                <td className="px-8 py-4 align-top">
                  <WorkerStatusBadge worker={worker} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination total={workers.length} />
    </>
  );
}

function RetiredWorkerTable({ workers }: { workers: RetiredWorkerRecord[] }) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] table-fixed">
          <thead className="bg-surface-secondary text-left">
            <tr className="border-b border-border">
              <TableHead className="w-[34%] pl-8">이름 / 사번</TableHead>
              <TableHead className="w-[20%]">근무 유형</TableHead>
              <TableHead className="w-[24%]">임금명세서 템플릿</TableHead>
              <TableHead className="w-[22%] pr-8">퇴사일</TableHead>
            </tr>
          </thead>
          <tbody>
            {workers.map((worker) => (
              <tr key={worker.id} className="border-b border-border">
                <td className="px-8 py-4 align-top">
                  <p className="font-semibold text-foreground">{worker.name}</p>
                  <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                    {ORG_CODE}-{worker.employeeNumberSuffix}
                  </p>
                </td>
                <td className="whitespace-nowrap px-4 py-4 align-top text-sm text-foreground">
                  {SCHEDULE_TYPE_LABEL[worker.scheduleType]}
                </td>
                <td className="px-4 py-4 align-top">
                  <PayrollTemplateBadge template={worker.payTemplate} />
                </td>
                <td className="whitespace-nowrap px-8 py-4 align-top text-sm tabular-nums text-foreground">
                  {worker.resignedAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination total={workers.length} />
    </>
  );
}

function WorkerDetail({
  worker,
  mode,
  draft,
  setDraft,
  setMode,
  onDelete,
  onResign,
}: {
  worker: WorkerRecord;
  mode: WorkerMode;
  draft: WorkerDraft;
  setDraft: React.Dispatch<React.SetStateAction<WorkerDraft>>;
  setMode: React.Dispatch<React.SetStateAction<WorkerMode>>;
  onDelete: () => void;
  onResign: () => void;
}) {
  const editable = mode === "edit";

  return (
    <WorkerEditor
      title={worker.name}
      eyebrow="근무자 상세"
      mode={mode}
      worker={worker}
      draft={draft}
      setDraft={setDraft}
      onSaveDisabled={!canSaveWorker(draft)}
      actions={
        editable ? (
          <div className="flex items-center gap-2">
            <Button type="button" disabled={!canSaveWorker(draft)} onClick={() => setMode("view")}>
              <Check className="size-4" aria-hidden="true" />
              저장
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMode("view");
                setDraft(createDraftFromWorker(worker));
              }}
            >
              <X className="size-4" aria-hidden="true" />
              취소
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" onClick={() => setMode("edit")}>
            <Pencil className="size-4" aria-hidden="true" />
            수정
          </Button>
        )
      }
      managementActions={
        <div className="max-w-4xl">
          <SectionHeader
            title="관리 작업"
            description="근무 이력 여부에 따라 삭제 또는 퇴사 처리를 선택해요."
          />
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="outline" disabled={worker.hasHistory} onClick={onDelete}>
              <Trash2 className="size-4" aria-hidden="true" />
              등록 삭제
            </Button>
            <Button type="button" variant="destructive" onClick={onResign}>
              <UserX className="size-4" aria-hidden="true" />
              퇴사 처리
            </Button>
          </div>
          <p className="mt-3 text-pretty text-sm leading-6 text-muted-foreground">
            실제 근무 이력이 있는 근무자는 삭제하지 않고 퇴사 처리해야 해요. 퇴사 처리된 근무자의
            근태·급여 이력은 3년간 보존돼요.
          </p>
        </div>
      }
    />
  );
}

function WorkerEditor({
  title,
  eyebrow,
  mode,
  worker,
  draft,
  setDraft,
  onSaveDisabled,
  actions,
  managementActions,
}: {
  title: string;
  eyebrow: string;
  mode: WorkerMode;
  worker?: WorkerRecord;
  draft: WorkerDraft;
  setDraft: React.Dispatch<React.SetStateAction<WorkerDraft>>;
  onSaveDisabled: boolean;
  actions?: React.ReactNode;
  managementActions?: React.ReactNode;
}) {
  const editable = mode !== "view";

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border px-8 py-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
          <h2 className="mt-1 text-balance text-2xl font-bold text-foreground">{title}</h2>
        </div>
        {actions ??
          (mode === "create" ? (
            <div className="flex items-center gap-2">
              <Button type="button" disabled={onSaveDisabled}>
                <Check className="size-4" aria-hidden="true" />
                저장
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/members">취소</Link>
              </Button>
            </div>
          ) : null)}
      </div>

      <div className="space-y-10 px-8 py-7">
        <section className="max-w-4xl">
          <SectionHeader title="기본 정보" description="근무자 등록과 식별에 필요한 정보예요." />
          {editable ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <FieldBlock label="이름" required>
                <Input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="근무자 이름"
                  aria-invalid={!draft.name}
                />
                {!draft.name ? <FieldError>이름을 입력해야 저장할 수 있어요.</FieldError> : null}
              </FieldBlock>

              <FieldBlock label="입사일" required>
                <Input
                  type="date"
                  value={draft.joinedAt}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, joinedAt: event.target.value }))
                  }
                  aria-invalid={!draft.joinedAt}
                />
              </FieldBlock>

              {mode === "create" ? (
                <AutoEmployeeNumberNotice />
              ) : worker ? (
                <div className="md:col-span-2">
                  <ReadonlyField
                    label="사번"
                    value={`${ORG_CODE}-${worker.employeeNumberSuffix}`}
                    tabular
                  />
                  <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
                    사번은 근무자 최초 인증에 사용되어 변경할 수 없어요.
                  </p>
                </div>
              ) : null}

              <FieldBlock label="전화번호" optional>
                <Input
                  value={draft.phone}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, phone: event.target.value }))
                  }
                  placeholder="010-0000-0000"
                />
              </FieldBlock>
            </div>
          ) : worker ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <ReadonlyField label="이름" value={worker.name} />
              <ReadonlyField
                label="사번"
                value={`${ORG_CODE}-${worker.employeeNumberSuffix}`}
                tabular
              />
              <ReadonlyField label="입사일" value={worker.joinedAt} tabular />
              <ReadonlyField label="전화번호" value={worker.phone || "미입력"} />
              <div>
                <p className="text-sm font-medium text-muted-foreground">인증 여부</p>
                <div className="mt-2">
                  <VerificationBadge status={worker.verificationStatus} />
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="max-w-4xl">
          <SectionHeader title="근무 설정" description="근무 방식과 급여 계산 기준을 지정해요." />
          <div className="mt-5 grid gap-5">
            {editable ? (
              <>
                <FieldBlock label="근무 유형" required>
                  <Select
                    value={draft.scheduleType}
                    onValueChange={(value: ScheduleType) =>
                      setDraft((current) => ({ ...current, scheduleType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="근무 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">고정 근무</SelectItem>
                      <SelectItem value="flexible">신청 근무</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldBlock>

                <FieldBlock label="임금명세서 템플릿" required>
                  <Select
                    value={draft.payTemplate}
                    onValueChange={(value) =>
                      setDraft((current) => ({ ...current, payTemplate: value }))
                    }
                  >
                    <SelectTrigger aria-invalid={!draft.payTemplate}>
                      <SelectValue placeholder="템플릿 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYROLL_TEMPLATES.map((template) => (
                        <SelectItem key={template} value={template}>
                          {template}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!draft.payTemplate ? (
                    <FieldError>임금명세서 템플릿을 선택해야 저장할 수 있어요.</FieldError>
                  ) : null}
                </FieldBlock>

                {draft.scheduleType === "fixed" ? (
                  <FixedPatternEditor draft={draft} setDraft={setDraft} />
                ) : null}

                <FieldBlock label="변경 반영 시점" required>
                  <Select
                    value={draft.applyTiming}
                    onValueChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        applyTiming: value,
                        customApplyDate: value === "직접 입력" ? current.customApplyDate : "",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="반영 시점 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="즉시 다음 근무">즉시 다음 근무</SelectItem>
                      <SelectItem value="다음 주">다음 주</SelectItem>
                      <SelectItem value="다음 달">다음 달</SelectItem>
                      <SelectItem value="직접 입력">직접 입력</SelectItem>
                    </SelectContent>
                  </Select>
                  {draft.applyTiming === "직접 입력" ? (
                    <div className="mt-3">
                      <Input
                        type="date"
                        value={draft.customApplyDate}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            customApplyDate: event.target.value,
                          }))
                        }
                        aria-invalid={!draft.customApplyDate}
                      />
                      {!draft.customApplyDate ? (
                        <FieldError className="mt-2">
                          변경을 적용할 날짜를 선택해야 저장할 수 있어요.
                        </FieldError>
                      ) : null}
                    </div>
                  ) : null}
                </FieldBlock>
              </>
            ) : worker ? (
              <>
                <ReadonlyField label="근무 유형" value={SCHEDULE_TYPE_LABEL[worker.scheduleType]} />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">임금명세서 템플릿</p>
                  <div className="mt-2">
                    <PayrollTemplateBadge template={worker.payTemplate} />
                  </div>
                </div>
                {worker.scheduleType === "fixed" && worker.fixedPattern ? (
                  <FixedPatternSummary
                    pattern={worker.fixedPattern}
                    applyTiming={worker.applyTiming}
                  />
                ) : null}
              </>
            ) : null}
          </div>
        </section>

        {managementActions ? (
          <section className="border-t border-border pt-8">{managementActions}</section>
        ) : null}
      </div>
    </Card>
  );
}

function FixedPatternEditor({
  draft,
  setDraft,
}: {
  draft: WorkerDraft;
  setDraft: React.Dispatch<React.SetStateAction<WorkerDraft>>;
}) {
  const selectedDays = draft.fixedPattern.days;

  return (
    <div className="rounded-xl border border-border bg-surface-secondary p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-balance text-sm font-semibold text-foreground">고정 근무 패턴</h3>
          <p className="mt-1 text-pretty text-sm leading-6 text-muted-foreground">
            반복 요일과 공통 시간을 한 번에 지정해요.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit whitespace-nowrap">
          선택 {selectedDays.length}일
        </Badge>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {DAYS.map((day) => {
          const active = selectedDays.includes(day.id);

          return (
            <button
              key={day.id}
              type="button"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  fixedPattern: {
                    ...current.fixedPattern,
                    days: active
                      ? current.fixedPattern.days.filter((dayId) => dayId !== day.id)
                      : [...current.fixedPattern.days, day.id],
                  },
                }))
              }
              className={cn(
                "h-9 rounded-full border px-4 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {day.label}
            </button>
          );
        })}
      </div>
      {selectedDays.length === 0 ? (
        <FieldError className="mt-3">고정 근무는 최소 1개 요일을 선택해야 해요.</FieldError>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <FieldBlock label="근무 시간" required>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
            <TimeSelect
              value={draft.fixedPattern.start}
              onChange={(value) => updateFixedPattern("start", value, setDraft)}
            />
            <span className="text-sm text-muted-foreground">-</span>
            <TimeSelect
              value={draft.fixedPattern.end}
              onChange={(value) => updateFixedPattern("end", value, setDraft)}
            />
          </div>
        </FieldBlock>

        <FieldBlock label="휴게 시간" required>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
            <TimeSelect
              value={draft.fixedPattern.breakStart}
              onChange={(value) => updateFixedPattern("breakStart", value, setDraft)}
            />
            <span className="text-sm text-muted-foreground">-</span>
            <TimeSelect
              value={draft.fixedPattern.breakEnd}
              onChange={(value) => updateFixedPattern("breakEnd", value, setDraft)}
            />
          </div>
        </FieldBlock>
      </div>
    </div>
  );
}

function TimeSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [hour = "00", minute = "00"] = value.split(":");

  const updateHour = (nextHour: string) => {
    onChange(`${nextHour}:${minute}`);
  };

  const updateMinute = (nextMinute: string) => {
    onChange(`${hour}:${nextMinute}`);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
      <Select value={hour} onValueChange={updateHour}>
        <SelectTrigger className="bg-card tabular-nums">
          <SelectValue aria-label="시" />
        </SelectTrigger>
        <SelectContent className="max-h-64 overflow-y-auto" position="item-aligned">
          {HOUR_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}시
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={minute} onValueChange={updateMinute}>
        <SelectTrigger className="bg-card tabular-nums">
          <SelectValue aria-label="분" />
        </SelectTrigger>
        <SelectContent className="max-h-64 overflow-y-auto" position="item-aligned">
          {MINUTE_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}분
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FixedPatternSummary({
  pattern,
  applyTiming,
}: {
  pattern: FixedPattern;
  applyTiming: string;
}) {
  const dayLabels = pattern.days
    .map((dayId) => DAYS.find((day) => day.id === dayId)?.label)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="rounded-xl border border-border bg-surface-secondary p-5">
      <div className="flex items-center gap-2">
        <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-semibold text-foreground">고정 근무 패턴</p>
      </div>
      <dl className="mt-4 grid gap-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">요일</dt>
          <dd className="font-medium text-foreground">{dayLabels}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">근무 시간</dt>
          <dd className="tabular-nums text-foreground">
            {pattern.start} - {pattern.end}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">휴게 시간</dt>
          <dd className="tabular-nums text-foreground">
            {pattern.breakStart} - {pattern.breakEnd}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">반영 시점</dt>
          <dd className="text-foreground">{applyTiming}</dd>
        </div>
      </dl>
    </div>
  );
}

function TableHead({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
  );
}

function AutoEmployeeNumberNotice() {
  return (
    <div className="rounded-xl border border-border bg-surface-secondary p-5 md:col-span-2">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card text-muted-foreground">
          <KeyRound className="size-4" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">사번은 저장 후 자동 발급돼요</p>
          <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
            서버가 조직 코드 기준으로 다음 사번을 생성해요. 발급된 사번은 목록과 상세 화면에서
            확인할 수 있고, 근무자는 앱에서 이 사번으로 최초 인증해요.
          </p>
        </div>
      </div>
    </div>
  );
}

function TablePagination({ total }: { total: number }) {
  const visibleCount = Math.min(total, 10);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-8 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>{total === 0 ? "0명" : `1-${visibleCount} / ${total}명`}</p>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled>
          이전
        </Button>
        <Button type="button" variant="secondary" size="sm" disabled>
          1
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={total <= 10}>
          다음
        </Button>
      </div>
    </div>
  );
}

function ListTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function FilterSelect({
  label,
  options,
  disabled = false,
}: {
  label: string;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <Select defaultValue={options[0]} disabled={disabled}>
      <SelectTrigger className="h-9 w-[9.5rem] bg-card text-sm">
        <SelectValue aria-label={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {label}: {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-balance text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-pretty text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function FieldBlock({
  label,
  required = false,
  optional = false,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="inline-flex items-center gap-2">
        {label}
        {required ? <RequiredMark /> : null}
        {optional ? <OptionalMark /> : null}
      </Label>
      {children}
    </div>
  );
}

function RequiredMark() {
  return (
    <span className="rounded-full bg-status-cancelled-subtle px-2 py-0.5 text-xs font-semibold text-status-cancelled">
      필수
    </span>
  );
}

function OptionalMark() {
  return (
    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
      선택
    </span>
  );
}

function FieldError({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-pretty text-sm leading-5 text-status-cancelled", className)}>
      {children}
    </p>
  );
}

function ReadonlyField({
  label,
  value,
  tabular = false,
}: {
  label: string;
  value: string;
  tabular?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-sm font-medium text-foreground", tabular && "tabular-nums")}>
        {value}
      </p>
    </div>
  );
}

function WorkerStatusBadge({ worker }: { worker: WorkerRecord }) {
  if (worker.employmentStatus === "setup-needed") {
    return (
      <Badge variant="secondary" className="whitespace-nowrap">
        <AlertTriangle className="size-3.5" aria-hidden="true" />
        설정 필요
      </Badge>
    );
  }

  return (
    <Badge variant="confirmed" className="whitespace-nowrap">
      <ShieldCheck className="size-3.5" aria-hidden="true" />
      설정 완료
    </Badge>
  );
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status === "verified") {
    return (
      <Badge variant="confirmed" className="whitespace-nowrap">
        <KeyRound className="size-3.5" aria-hidden="true" />
        인증
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="whitespace-nowrap">
      <KeyRound className="size-3.5" aria-hidden="true" />
      미인증
    </Badge>
  );
}

function PayrollTemplateBadge({ template }: { template: string }) {
  if (!template) {
    return (
      <Badge variant="secondary" className="whitespace-nowrap">
        <FileText className="size-3.5" aria-hidden="true" />
        미지정
      </Badge>
    );
  }

  return (
    <Badge variant="confirmed" className="max-w-full whitespace-nowrap">
      <FileText className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{template}</span>
    </Badge>
  );
}

function canSaveWorker(draft: WorkerDraft) {
  return Boolean(
    draft.name &&
    draft.joinedAt &&
    draft.payTemplate &&
    (draft.scheduleType === "flexible" || draft.fixedPattern.days.length > 0) &&
    (draft.applyTiming !== "직접 입력" || draft.customApplyDate),
  );
}

function createDraftFromWorker(worker: WorkerRecord | null): WorkerDraft {
  if (!worker) {
    return { ...NEW_WORKER_DRAFT, fixedPattern: createDefaultFixedPattern() };
  }

  return {
    name: worker.name,
    joinedAt: worker.joinedAt,
    phone: worker.phone,
    scheduleType: worker.scheduleType,
    payTemplate: worker.payTemplate,
    fixedPattern: worker.fixedPattern ?? createDefaultFixedPattern(),
    applyTiming: worker.applyTiming,
    customApplyDate: "",
  };
}

function createDefaultFixedPattern(): FixedPattern {
  return {
    days: ["mon", "wed"],
    start: "09:00",
    end: "18:00",
    breakStart: "13:00",
    breakEnd: "14:00",
  };
}

function updateFixedPattern(
  field: keyof Omit<FixedPattern, "days">,
  value: string,
  setDraft: React.Dispatch<React.SetStateAction<WorkerDraft>>,
) {
  setDraft((current) => ({
    ...current,
    fixedPattern: {
      ...current.fixedPattern,
      [field]: value,
    },
  }));
}

type FixedPattern = {
  days: DayId[];
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
};

type WorkerRecord = {
  id: string;
  name: string;
  employeeNumberSuffix: string;
  joinedAt: string;
  phone: string;
  scheduleType: ScheduleType;
  payTemplate: string;
  verificationStatus: VerificationStatus;
  employmentStatus: EmploymentStatus;
  hasHistory: boolean;
  fixedPattern?: FixedPattern;
  applyTiming: string;
};

type RetiredWorkerRecord = {
  id: string;
  name: string;
  employeeNumberSuffix: string;
  joinedAt: string;
  resignedAt: string;
  scheduleType: ScheduleType;
  payTemplate: string;
};

type WorkerDraft = {
  name: string;
  joinedAt: string;
  phone: string;
  scheduleType: ScheduleType;
  payTemplate: string;
  fixedPattern: FixedPattern;
  applyTiming: string;
  customApplyDate: string;
};

const SCHEDULE_TYPE_LABEL: Record<ScheduleType, string> = {
  fixed: "고정 근무",
  flexible: "신청 근무",
};

const DAYS: { id: DayId; label: string }[] = [
  { id: "mon", label: "월" },
  { id: "tue", label: "화" },
  { id: "wed", label: "수" },
  { id: "thu", label: "목" },
  { id: "fri", label: "금" },
  { id: "sat", label: "토" },
  { id: "sun", label: "일" },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));

const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));
