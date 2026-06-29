import type { PrismaClient } from "@fragment/database";
import type {
  ScheduleHistoryDetailResponse,
  ScheduleHistoryListResponse,
  ScheduleHistoryQuery,
} from "@fragment/shared";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import { dateStringToDate, dateToDateString, dateToTimeString } from "@/utils/date-time";
import { toApiId, toPrismaId } from "@/utils/mapper";
import { scheduleDetailInclude, toScheduleDetail } from "@/modules/schedules/schedules.mapper";

const createScheduleNotFoundError = () =>
  new HttpError(404, ERROR_CODES.SCHEDULE_NOT_FOUND, "스케줄을 찾을 수 없습니다.");

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const createDateRangeFilter = ({ year, month }: ScheduleHistoryQuery) => {
  const startDate = dateStringToDate(`${year}-${String(month ?? 1).padStart(2, "0")}-01`);
  const endDate =
    month === undefined ? dateStringToDate(`${year}-12-31`) : new Date(Date.UTC(year, month, 0));

  return {
    endDate: {
      gte: startDate,
    },
    startDate: {
      lte: endDate,
    },
  };
};

export async function listScheduleHistory(
  prisma: PrismaClient,
  organizationId: string,
  query: ScheduleHistoryQuery,
): Promise<ScheduleHistoryListResponse> {
  const schedules = await prisma.schedule.findMany({
    where: {
      organizationId: toPrismaId(organizationId),
      status: "CONFIRMED",
      ...createDateRangeFilter(query),
    },
    orderBy: [{ confirmedAt: "desc" }, { id: "desc" }],
  });

  return {
    items: schedules.map((schedule) => ({
      id: toApiId(schedule.id),
      startDate: dateToDateString(schedule.startDate),
      endDate: dateToDateString(schedule.endDate),
      confirmedAt: schedule.confirmedAt!.toISOString(),
    })),
  };
}

export async function getScheduleHistoryDetail(
  prisma: PrismaClient,
  organizationId: string,
  scheduleId: string,
): Promise<ScheduleHistoryDetailResponse> {
  const schedule = await prisma.schedule.findFirst({
    where: {
      id: toPrismaId(scheduleId),
      organizationId: toPrismaId(organizationId),
      status: "CONFIRMED",
    },
    include: scheduleDetailInclude,
  });

  if (!schedule) {
    throw createScheduleNotFoundError();
  }

  return toScheduleDetail(schedule) as ScheduleHistoryDetailResponse;
}

const escapeCsvCell = (value: string) => {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
};

const createCsvRow = (values: string[]) => values.map(escapeCsvCell).join(",");

export async function exportScheduleHistoryCsv(
  prisma: PrismaClient,
  organizationId: string,
  scheduleId: string,
): Promise<string> {
  const schedule = await getScheduleHistoryDetail(prisma, organizationId, scheduleId);
  const rows = [
    createCsvRow(["날짜", "요일", "시작시간", "종료시간", "사번", "근무자명"]),
    ...schedule.assignments.map((assignment) => {
      const workDate = dateStringToDate(assignment.workDate);

      return createCsvRow([
        assignment.workDate,
        WEEKDAY_LABELS[workDate.getUTCDay()],
        dateToTimeString(new Date(assignment.startsAt)),
        dateToTimeString(new Date(assignment.endsAt)),
        assignment.employeeCodeSnapshot,
        assignment.workerNameSnapshot,
      ]);
    }),
  ];

  return rows.join("\n");
}
