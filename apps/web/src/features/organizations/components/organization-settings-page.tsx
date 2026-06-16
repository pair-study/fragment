"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Lock,
  Pencil,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { type ClosureRule, OrganizationClosureSection } from "./organization-closure-section";
import { GpsRadiusField } from "./gps-radius-field";
import { type WorkType, WorkTypeField } from "./work-type-field";

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

export function OrganizationSettingsPage() {
  const [basicEditing, setBasicEditing] = useState(false);
  const [closureEditing, setClosureEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [name, setName] = useState(CURRENT_ORG.name);
  const [roadAddress, setRoadAddress] = useState(CURRENT_ORG.roadAddress);
  const [addressDetail, setAddressDetail] = useState(CURRENT_ORG.addressDetail);
  const [radius, setRadius] = useState(CURRENT_ORG.gpsRadius);
  const [workType, setWorkType] = useState<WorkType>(CURRENT_ORG.workType);
  const [closures, setClosures] = useState<ClosureRule[]>(CURRENT_ORG.closures);

  return (
    <main className="min-h-full bg-background px-6 py-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header>
          <h1 className="text-balance text-2xl font-bold text-foreground">조직 관리</h1>
          <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
            현재 선택된 조직의 기본 정보, 출퇴근 위치 기준, 근무 유형, 휴무일을 관리해요.
          </p>
        </header>

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
              </dl>
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
      </div>

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
    </main>
  );
}

function formatClosureRule(rule: ClosureRule) {
  if (rule.type === "weekly") return `매주 ${rule.value} - ${rule.label}`;
  if (rule.type === "biweekly") return `격주 ${rule.value} - ${rule.label}`;
  return `${rule.value} - ${rule.label}`;
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
