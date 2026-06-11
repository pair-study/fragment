import { OrganizationForm } from "@/features/organizations/components/organization-form";
import { OrganizationFormPageShell } from "@/features/organizations/components/organization-form-page-shell";

export default function OrganizationSettingsPage() {
  return (
    <OrganizationFormPageShell
      title="조직 수정"
      description="조직명·주소·GPS 반경·근무 유형·휴무일을 수정할 수 있어요. 변경사항은 저장 즉시 반영돼요."
    >
      <OrganizationForm mode="edit" />
    </OrganizationFormPageShell>
  );
}
