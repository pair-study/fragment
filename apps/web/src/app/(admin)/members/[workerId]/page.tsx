import { MemberManagementPage } from "@/features/members/components/member-management-page";

type MemberDetailPageProps = {
  params: Promise<{
    workerId: string;
  }>;
};

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { workerId } = await params;

  return <MemberManagementPage view="detail" workerId={workerId} />;
}
