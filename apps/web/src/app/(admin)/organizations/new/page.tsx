import { MvpOrganizationForm } from "@/features/organizations/components/mvp-organization-form";
import { OrganizationFormPageShell } from "@/features/organizations/components/organization-form-page-shell";

export default function NewOrganizationPage() {
  return (
    <OrganizationFormPageShell
      title="매장 생성"
      description="스케줄 추천을 시작하기 위해 사용할 단일 매장 정보를 등록하세요."
    >
      <MvpOrganizationForm />
    </OrganizationFormPageShell>
  );
}
