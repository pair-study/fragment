import { OrganizationForm } from "@/features/organizations/components/organization-form";
import { OrganizationFormPageShell } from "@/features/organizations/components/organization-form-page-shell";

export default function NewOrganizationPage() {
  return (
    <OrganizationFormPageShell
      title="조직 등록"
      description="사업자 정보와 위치를 등록하면 스케줄 편성과 GPS 출퇴근을 바로 시작할 수 있어요."
    >
      <OrganizationForm mode="create" />
    </OrganizationFormPageShell>
  );
}
