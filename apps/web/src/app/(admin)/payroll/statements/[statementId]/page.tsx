import { PayrollStatementPage } from "@/features/payroll/components/payroll-statement-page";

type PayrollStatementRoutePageProps = {
  params: Promise<{
    statementId: string;
  }>;
};

export default async function PayrollStatementRoutePage({
  params,
}: PayrollStatementRoutePageProps) {
  const { statementId } = await params;

  return <PayrollStatementPage statementId={statementId} />;
}
