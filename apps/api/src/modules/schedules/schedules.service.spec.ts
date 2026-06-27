import type { DayOfWeek } from "@fragment/database";
import { describe, expect, it } from "@jest/globals";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { createFakePrisma, createTimeDate } from "../../../test/helpers/fake-prisma";
import {
  confirmSchedule,
  createScheduleAssignment,
  recommendSchedule,
  updateScheduleAssignment,
} from "./schedules.service";

const timestamp = new Date("2026-06-25T00:00:00.000Z");
const dateOnly = (date: string) => new Date(`${date}T00:00:00.000Z`);

const createOrganization = (id = BigInt(1), userId = BigInt(1)) => ({
  id,
  userId,
  name: "프래그먼트 카페",
  businessHours: [],
});

const createPlanningPeriod = ({ endDate = "2026-07-01", startDate = "2026-07-01" } = {}) => ({
  id: BigInt(1),
  organizationId: BigInt(1),
  startDate: dateOnly(startDate),
  endDate: dateOnly(endDate),
  createdAt: timestamp,
  updatedAt: timestamp,
});

const createWorker = ({
  id = BigInt(1),
  organizationId = BigInt(1),
  employeeCode = "W-0001",
  name = "김민수",
} = {}) => ({
  id,
  organizationId,
  employeeCode,
  name,
  weeklyContractHours: 40,
});

const createAvailableTime = ({
  availableDate = "2026-07-01",
  endsAt = "2026-07-01T18:00:00.000Z",
  id = BigInt(1),
  startsAt = "2026-07-01T09:00:00.000Z",
  workerId = BigInt(1),
} = {}) => ({
  id,
  workerId,
  availableDate: dateOnly(availableDate),
  startsAt: new Date(startsAt),
  endsAt: new Date(endsAt),
  createdAt: timestamp,
  updatedAt: timestamp,
});

const createMinimumStaffingRule = ({
  dayOfWeek = "WED",
  endTime = "14:00",
  endsNextDay = false,
  requiredCount = 1,
  startTime = "10:00",
}: {
  dayOfWeek?: DayOfWeek;
  endTime?: string;
  endsNextDay?: boolean;
  requiredCount?: number;
  startTime?: string;
} = {}) => ({
  id: BigInt(1),
  organizationId: BigInt(1),
  dayOfWeek,
  startTime: createTimeDate(startTime),
  endTime: createTimeDate(endTime),
  endsNextDay,
  requiredCount,
  createdAt: timestamp,
  updatedAt: timestamp,
});

const createDraftSchedule = ({
  id = BigInt(1),
  status = "DRAFT",
}: {
  id?: bigint;
  status?: "DRAFT" | "CONFIRMED";
} = {}) => ({
  id,
  organizationId: BigInt(1),
  status,
  inputHash: `hash-${id.toString()}`,
  startDate: dateOnly("2026-07-01"),
  endDate: dateOnly("2026-07-01"),
  generatedAt: timestamp,
  confirmedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
});

const createAssignment = () => ({
  id: BigInt(10),
  scheduleId: BigInt(1),
  workerId: BigInt(1),
  workDate: dateOnly("2026-07-01"),
  startsAt: new Date("2026-07-01T10:00:00.000Z"),
  endsAt: new Date("2026-07-01T14:00:00.000Z"),
  workerNameSnapshot: "김민수",
  employeeCodeSnapshot: "W-0001",
  createdAt: timestamp,
  updatedAt: timestamp,
});

describe("recommendSchedule", () => {
  it("blocks recommendation when there is no active planning period", async () => {
    const { prisma } = createFakePrisma({
      organizations: [createOrganization()],
    });

    await expect(
      recommendSchedule(prisma, "1", {
        startDate: "2026-07-01",
        endDate: "2026-07-01",
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.NO_ACTIVE_PLANNING_PERIOD,
      statusCode: 400,
    });
  });

  it("creates a DRAFT schedule and records unmet staffing shortages", async () => {
    const { prisma } = createFakePrisma({
      activeSchedulePlanningPeriods: [createPlanningPeriod()],
      availableTimes: [createAvailableTime()],
      minimumStaffingRules: [createMinimumStaffingRule({ requiredCount: 2 })],
      organizations: [createOrganization()],
      workers: [createWorker()],
    });

    const schedule = await recommendSchedule(prisma, "1", {
      startDate: "2026-07-01",
      endDate: "2026-07-01",
    });

    expect(schedule).toMatchObject({
      id: "1",
      status: "DRAFT",
      startDate: "2026-07-01",
      endDate: "2026-07-01",
    });
    expect(schedule.assignments).toEqual([
      expect.objectContaining({
        workerId: "1",
        workDate: "2026-07-01",
        startsAt: "2026-07-01T10:00:00.000Z",
        endsAt: "2026-07-01T14:00:00.000Z",
      }),
    ]);
    expect(schedule.workerShortages).toEqual([
      expect.objectContaining({
        workDate: "2026-07-01",
        dayOfWeek: "WED",
        requiredCount: 2,
        assignedCount: 1,
      }),
    ]);
  });

  it("creates next-day assignments for overnight staffing rules", async () => {
    const { prisma } = createFakePrisma({
      activeSchedulePlanningPeriods: [
        createPlanningPeriod({
          startDate: "2026-07-03",
          endDate: "2026-07-03",
        }),
      ],
      availableTimes: [
        createAvailableTime({
          availableDate: "2026-07-03",
          startsAt: "2026-07-03T22:00:00.000Z",
          endsAt: "2026-07-04T02:00:00.000Z",
        }),
      ],
      minimumStaffingRules: [
        createMinimumStaffingRule({
          dayOfWeek: "FRI",
          startTime: "22:00",
          endTime: "02:00",
          endsNextDay: true,
        }),
      ],
      organizations: [createOrganization()],
      workers: [createWorker()],
    });

    const schedule = await recommendSchedule(prisma, "1", {
      startDate: "2026-07-03",
      endDate: "2026-07-03",
    });

    expect(schedule.assignments).toEqual([
      expect.objectContaining({
        workDate: "2026-07-03",
        startsAt: "2026-07-03T22:00:00.000Z",
        endsAt: "2026-07-04T02:00:00.000Z",
      }),
    ]);
    expect(schedule.workerShortages).toEqual([]);
  });

  it("does not create a duplicate DRAFT for the same input conditions", async () => {
    const { prisma } = createFakePrisma({
      activeSchedulePlanningPeriods: [createPlanningPeriod()],
      availableTimes: [createAvailableTime()],
      minimumStaffingRules: [createMinimumStaffingRule()],
      organizations: [createOrganization()],
      workers: [createWorker()],
    });

    await recommendSchedule(prisma, "1", {
      startDate: "2026-07-01",
      endDate: "2026-07-01",
    });

    await expect(
      recommendSchedule(prisma, "1", {
        startDate: "2026-07-01",
        endDate: "2026-07-01",
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.DRAFT_ALREADY_EXISTS,
      statusCode: 409,
    });
  });
});

describe("schedule assignments", () => {
  it("rejects workers from another organization when adding an assignment", async () => {
    const { prisma } = createFakePrisma({
      organizations: [createOrganization(), createOrganization(BigInt(2), BigInt(2))],
      schedules: [createDraftSchedule()],
      workers: [createWorker({ organizationId: BigInt(2) })],
    });

    await expect(
      createScheduleAssignment(prisma, "1", "1", {
        workerId: "1",
        workDate: "2026-07-01",
        startsAt: "2026-07-01T10:00:00.000Z",
        endsAt: "2026-07-01T14:00:00.000Z",
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.WORKER_NOT_FOUND,
      statusCode: 404,
    });
  });

  it("allows updates only while the schedule is DRAFT", async () => {
    const { prisma } = createFakePrisma({
      organizations: [createOrganization()],
      scheduleAssignments: [createAssignment()],
      schedules: [createDraftSchedule({ status: "CONFIRMED" })],
      workers: [createWorker()],
    });

    await expect(
      updateScheduleAssignment(prisma, "1", "1", "10", {
        startsAt: "2026-07-01T11:00:00.000Z",
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.CONFLICT,
      statusCode: 409,
    });
  });

  it("rejects assignment updates that would make the end time earlier than the start time", async () => {
    const { prisma } = createFakePrisma({
      organizations: [createOrganization()],
      scheduleAssignments: [createAssignment()],
      schedules: [createDraftSchedule()],
      workers: [createWorker()],
    });

    await expect(
      updateScheduleAssignment(prisma, "1", "1", "10", {
        startsAt: "2026-07-01T15:00:00.000Z",
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_ERROR,
      statusCode: 400,
    });
  });
});

describe("confirmSchedule", () => {
  it("changes a DRAFT schedule to CONFIRMED", async () => {
    const { prisma } = createFakePrisma({
      organizations: [createOrganization()],
      scheduleAssignments: [createAssignment()],
      schedules: [createDraftSchedule()],
      workers: [createWorker()],
    });

    const schedule = await confirmSchedule(prisma, "1", "1");

    expect(schedule.status).toBe("CONFIRMED");
    expect(schedule.confirmedAt).toEqual(expect.any(String));
    expect(schedule.assignments).toHaveLength(1);
  });
});
