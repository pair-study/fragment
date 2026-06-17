export type PayrollStatus = "signature-pending" | "signed" | "issued";

export type PayrollRow = {
  id: string;
  workerName: string;
  employeeNumber: string;
  payStandardName: string;
  confirmedHours: number;
  basePay: number;
  overtimePay: number;
  baseAllowance: number;
  taxDeduction: number;
  status: PayrollStatus;
};

export type PayrollExtraItem = {
  id: string;
  type: "earning" | "deduction";
  label: string;
  amount: number;
};

export const PAYROLL_ROWS: PayrollRow[] = [
  {
    id: "payroll-1",
    workerName: "박지훈",
    employeeNumber: "STB-KD-0007",
    payStandardName: "주간 시급제 기본",
    confirmedHours: 84,
    basePay: 882_000,
    overtimePay: 0,
    baseAllowance: 60_000,
    taxDeduction: 31_086,
    status: "signature-pending",
  },
  {
    id: "payroll-2",
    workerName: "김하은",
    employeeNumber: "STB-KD-0008",
    payStandardName: "주간 시급제 기본",
    confirmedHours: 86.5,
    basePay: 908_250,
    overtimePay: 180_000,
    baseAllowance: 75_000,
    taxDeduction: 38_388,
    status: "signed",
  },
  {
    id: "payroll-3",
    workerName: "이수민",
    employeeNumber: "STB-KD-0009",
    payStandardName: "야간 수당 포함",
    confirmedHours: 92,
    basePay: 1_104_000,
    overtimePay: 220_000,
    baseAllowance: 90_000,
    taxDeduction: 46_662,
    status: "signed",
  },
  {
    id: "payroll-4",
    workerName: "최유진",
    employeeNumber: "STB-KD-0010",
    payStandardName: "주말 포함 시급제",
    confirmedHours: 78,
    basePay: 936_000,
    overtimePay: 54_000,
    baseAllowance: 50_000,
    taxDeduction: 34_320,
    status: "signed",
  },
  {
    id: "payroll-5",
    workerName: "정민재",
    employeeNumber: "STB-KD-0011",
    payStandardName: "주간 시급제 기본",
    confirmedHours: 64,
    basePay: 672_000,
    overtimePay: 0,
    baseAllowance: 40_000,
    taxDeduction: 23_496,
    status: "issued",
  },
  {
    id: "payroll-6",
    workerName: "한소희",
    employeeNumber: "STB-KD-0012",
    payStandardName: "주간 시급제 기본",
    confirmedHours: 71,
    basePay: 745_500,
    overtimePay: 0,
    baseAllowance: 40_000,
    taxDeduction: 25_922,
    status: "signature-pending",
  },
];

export const DEFAULT_EXTRA_ITEMS: PayrollExtraItem[] = [
  {
    id: "extra-1",
    type: "earning",
    label: "식대",
    amount: 120_000,
  },
  {
    id: "extra-2",
    type: "deduction",
    label: "기타 공제",
    amount: 42_370,
  },
];

export function getBaseGrossPay(row: PayrollRow) {
  return row.basePay + row.overtimePay + row.baseAllowance;
}

export function getAdjustmentTotal(items: PayrollExtraItem[], type: PayrollExtraItem["type"]) {
  return items.filter((item) => item.type === type).reduce((total, item) => total + item.amount, 0);
}

export function getNetPay(row: PayrollRow, extraItems: PayrollExtraItem[] = []) {
  const earningTotal = getAdjustmentTotal(extraItems, "earning");
  const deductionTotal = getAdjustmentTotal(extraItems, "deduction");

  return getBaseGrossPay(row) + earningTotal - row.taxDeduction - deductionTotal;
}

export function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}
