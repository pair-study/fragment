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

const createPlanningPeriod = () => ({
  id: BigInt(1),
  organizationId: BigInt(1),
  startDate: dateOnly("2026-07-01"),
  endDate: dateOnly("2026-07-01"),
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

const createAvailableTime = ({ id = BigInt(1), workerId = BigInt(1) } = {}) => ({
  id,
  workerId,
  availableDate: dateOnly("2026-07-01"),
  startsAt: new Date("2026-07-01T09:00:00.000Z"),
  endsAt: new Date("2026-07-01T18:00:00.000Z"),
  createdAt: timestamp,
  updatedAt: timestamp,
});

const createMinimumStaffingRule = ({ requiredCount = 1 } = {}) => ({
  id: BigInt(1),
  organizationId: BigInt(1),
  dayOfWeek: "WED" as const,
  startTime: createTimeDate("10:00"),
  endTime: createTimeDate("14:00"),
  endsNextDay: false,
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
