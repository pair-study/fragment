"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { getApiErrorMessage } from "@/lib/api-error-message";
import { createOrganization } from "../api/organization-api";
import { OrganizationForm } from "./organization-form";
import { DEFAULT_ORGANIZATION_FORM_VALUES } from "../utils/organization-form-utils";

export function MvpOrganizationForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  return (
    <OrganizationForm
      initialValues={DEFAULT_ORGANIZATION_FORM_VALUES}
      submitError={submitError}
      submitLabel="조직 생성"
      submittingLabel="생성 중"
      onSubmit={async (request) => {
        setSubmitError(null);

        try {
          await createOrganization(request);
          router.push("/dashboard");
        } catch (error) {
          setSubmitError(
            getApiErrorMessage(error, "조직 생성 중 오류가 발생했습니다. 다시 시도해 주세요."),
          );
        }
      }}
    />
  );
}
