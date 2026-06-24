"use client";

import { useRouter } from "next/navigation";

import { OrganizationForm } from "./organization-form";
import { DEFAULT_ORGANIZATION_FORM_VALUES } from "../utils/organization-form-utils";

export function MvpOrganizationForm() {
  const router = useRouter();

  return (
    <OrganizationForm
      initialValues={DEFAULT_ORGANIZATION_FORM_VALUES}
      submitLabel="조직 생성"
      submittingLabel="생성 중"
      onSubmit={() => {
        router.push("/dashboard");
      }}
    />
  );
}
