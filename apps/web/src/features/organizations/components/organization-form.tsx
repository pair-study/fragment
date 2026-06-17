"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Lock, Search, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { GpsRadiusField } from "./gps-radius-field";
import { type ClosureRule, OrganizationClosureSection } from "./organization-closure-section";
import { OrganizationDeleteSection } from "./organization-delete-section";
import { type WorkType, WorkTypeField } from "./work-type-field";

type OrganizationFormMode = "create" | "edit";

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

export function OrganizationForm({ mode }: OrganizationFormProps) {
  const isEdit = mode === "edit";
  const [businessNumber, setBusinessNumber] = useState(isEdit ? "123-45-67890" : "");
  const [organizationName, setOrganizationName] = useState(isEdit ? "강남 운영 조직" : "");
  const [businessVerified, setBusinessVerified] = useState(isEdit);
  const [roadAddress, setRoadAddress] = useState(isEdit ? "서울 강남구 테헤란로 142" : "");
  const [addressDetail, setAddressDetail] = useState(isEdit ? "아크플레이스 1층" : "");
  const [radius, setRadius] = useState(isEdit ? 120 : 100);
  const [workType, setWorkType] = useState<WorkType | null>(isEdit ? "flexible" : null);
  const [closures, setClosures] = useState<ClosureRule[]>(
    isEdit ? editInitialClosures : createInitialClosures,
  );
  const hasInvalidClosure = closures.some((closure) => !closure.label.trim());
  const canSubmit =
    isEdit ||
    (businessVerified &&
      businessNumber.trim().length > 0 &&
      organizationName.trim().length > 0 &&
      roadAddress.trim().length > 0 &&
      radius >= 50 &&
      radius <= 300 &&
      workType !== null &&
      !hasInvalidClosure);

  return (
    <div className="space-y-6">
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
            <GpsRadiusField value={radius} hasAddress={Boolean(roadAddress)} onChange={setRadius} />
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
        </div>
      </section>

      <OrganizationClosureSection rules={closures} onChange={setClosures} />

      {isEdit ? <OrganizationDeleteSection activeWorkerCount={2} /> : null}

      <Card>
        <CardContent className="flex flex-col-reverse gap-3 p-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" asChild>
            <Link href={isEdit ? "/organizations" : "/organizations/empty"}>
              {isEdit ? "변경 취소" : "취소"}
            </Link>
          </Button>
          <Button type="button" className="min-w-48" disabled={!canSubmit}>
            <Check className="size-4" aria-hidden="true" />
            {isEdit ? "변경사항 저장" : "조직 생성 완료"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function RequiredMark({ hidden = false }: { hidden?: boolean }) {
  if (hidden) return null;
  return <span className="text-status-cancelled">*</span>;
}
