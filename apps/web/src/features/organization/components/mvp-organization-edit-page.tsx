"use client";

import { useRouter } from "next/navigation";
import { Button } from "@moyeorak/design-system";
import Link from "next/link";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { OrganizationForm } from "./organization-form";
import { MOCK_ORGANIZATION_FORM_VALUES } from "../utils/organization-form-utils";

export function MvpOrganizationEditPage() {
  const router = useRouter();

  return (
    <AdminPageShell
      title="조직 수정"
      description="단일 조직의 이름, 요일별 운영 시간, 매주 휴무일을 수정합니다."
      actions={
        <Button asChild variant="outline">
          <Link href="/dashboard">대시보드로 돌아가기</Link>
        </Button>
      }
      contentClassName="space-y-6"
    >
      <OrganizationForm
        cancelHref="/dashboard"
        initialValues={MOCK_ORGANIZATION_FORM_VALUES}
        submitLabel="변경사항 저장"
        submittingLabel="저장 중"
        onSubmit={() => {
          router.push("/dashboard");
        }}
      />
    </AdminPageShell>
  );
}
