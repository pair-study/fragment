import type { ReactNode } from "react";

import { AdminShell } from "@/components/layout/admin-shell";

// TODO: API 연동 후 서버에서 조직 목록을 가져와 조건부로 AdminShell 적용
// 조직이 없으면 AdminShell 없이 children만 렌더링 → /organizations/new 온보딩 플로우에서 사이드바 미노출
// const orgs = await getOrganizations();
// if (orgs.length === 0) return <>{children}</>;
export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <AdminShell>{children}</AdminShell>;
}
