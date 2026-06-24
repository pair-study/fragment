"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@moyeorak/design-system";
import Link from "next/link";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { getOrganization, updateOrganization } from "../api/organization-api";
import { OrganizationForm } from "./organization-form";
import {
  createOrganizationFormValuesFromDetail,
  type OrganizationFormValues,
} from "../utils/organization-form-utils";

export function MvpOrganizationEditPage() {
  const router = useRouter();
  const [formValues, setFormValues] = useState<OrganizationFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadOrganization() {
      try {
        const organization = await getOrganization();

        if (!ignore) {
          setFormValues(createOrganizationFormValuesFromDetail(organization));
        }
      } catch {
        if (!ignore) {
          setLoadError("조직 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadOrganization();

    return () => {
      ignore = true;
    };
  }, []);

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
      {isLoading ? (
        <p className="text-sm text-muted-foreground">조직 정보를 불러오는 중입니다.</p>
      ) : loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : formValues ? (
        <OrganizationForm
          cancelHref="/dashboard"
          initialValues={formValues}
          submitError={submitError}
          submitLabel="변경사항 저장"
          submittingLabel="저장 중"
          onSubmit={async (request) => {
            setSubmitError(null);

            try {
              await updateOrganization(request);
              router.push("/dashboard");
            } catch (error) {
              setSubmitError(
                getApiErrorMessage(error, "조직 수정 중 오류가 발생했습니다. 다시 시도해 주세요."),
              );
            }
          }}
        />
      ) : null}
    </AdminPageShell>
  );
}
