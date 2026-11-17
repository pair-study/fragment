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
  if (year === undefined) {
    return {};
  }

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

const FORMULA_INJECTION_PREFIX_PATTERN = /^\s*[=+\-@]/;

const escapeCsvCell = (value: string) => {
  const safeValue = FORMULA_INJECTION_PREFIX_PATTERN.test(value) ? `'${value}` : value;

  if (!/[",\n\r]/.test(safeValue)) {
    return safeValue;
  }

  return `"${safeValue.replace(/"/g, '""')}"`;
};

const createCsvRow = (values: string[]) => values.map(escapeCsvCell).join(",");
const UTF8_BOM = "\uFEFF";

const createScheduleDateRange = (startDate: string, endDate: string) => {
  const dates: string[] = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    dates.push(currentDate);
    const nextDate = dateStringToDate(currentDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    currentDate = dateToDateString(nextDate);
  }

  return dates;
};

const getAssignmentTimeRange = (
  assignment: ScheduleHistoryDetailResponse["assignments"][number],
) => {
  return `${dateToTimeString(new Date(assignment.startsAt))}-${dateToTimeString(
    new Date(assignment.endsAt),
  )}`;
};

const getScheduleTimeRanges = (assignments: ScheduleHistoryDetailResponse["assignments"]) => {
  return Array.from(new Set(assignments.map(getAssignmentTimeRange))).sort((a, b) =>
    a.localeCompare(b),
  );
};

export async function exportScheduleHistoryCsv(
  prisma: PrismaClient,
  organizationId: string,
  scheduleId: string,
): Promise<string> {
  const schedule = await getScheduleHistoryDetail(prisma, organizationId, scheduleId);
  const dates = createScheduleDateRange(schedule.startDate, schedule.endDate);
  const timeRanges = getScheduleTimeRanges(schedule.assignments);
  const rows = [
    createCsvRow(["날짜", "요일", ...timeRanges]),
    ...dates.map((date) => {
      const workDate = dateStringToDate(date);

      return createCsvRow([
        date,
        WEEKDAY_LABELS[workDate.getUTCDay()],
        ...timeRanges.map((timeRange) => {
          return schedule.assignments
            .filter(
              (assignment) =>
                assignment.workDate === date && getAssignmentTimeRange(assignment) === timeRange,
            )
            .map((assignment) => assignment.workerNameSnapshot)
            .join(" / ");
        }),
      ]);
    }),
  ];

  return `${UTF8_BOM}${rows.join("\n")}`;
}
