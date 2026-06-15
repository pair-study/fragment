import { AlertTriangle } from "lucide-react";

import { DeleteOrganizationDialog } from "./delete-organization-dialog";

type OrganizationDeleteSectionProps = {
  activeWorkerCount: number;
};

export function OrganizationDeleteSection({ activeWorkerCount }: OrganizationDeleteSectionProps) {
  const blocked = activeWorkerCount > 0;

  return (
    <section className="rounded-xl border border-status-cancelled-subtle bg-card p-6 shadow-card">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-status-cancelled">
            <AlertTriangle className="size-5" aria-hidden="true" />
            <h2 className="text-lg font-semibold">위험 구역</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            조직은 소속 근무자 전원 퇴사 처리 완료 후에만 삭제할 수 있어요. 삭제 후 조직 목록으로
            이동합니다.
          </p>
          {blocked ? (
            <p className="mt-3 text-sm font-semibold text-status-cancelled">
              재직 중인 근무자 {activeWorkerCount}명이 있습니다. 먼저 퇴사 처리 후 삭제해 주세요.
            </p>
          ) : null}
        </div>
        <DeleteOrganizationDialog activeWorkerCount={activeWorkerCount} />
      </div>
    </section>
  );
}
