import type { DayOfWeek } from "@fragment/database";
import { describe, expect, it } from "@jest/globals";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { createFakePrisma, createTimeDate } from "../../../test/helpers/fake-prisma";
import {
  confirmSchedule,
  createScheduleAssignment,
  getDraftSchedule,
  recommendSchedule,
  updateScheduleAssignment,
} from "./schedules.service";

const timestamp = new Date("2026-06-25T00:00:00.000Z");
const dateOnly = (date: string) => new Date(`${date}T00:00:00.000Z`);

const createBusinessHour = ({
  closeTime = "14:00",
  closesNextDay = false,
  dayOfWeek = "WED",
  id = BigInt(1),
  isClosed = false,
  openTime = "10:00",
  organizationId = BigInt(1),
}: {
  closeTime?: string;
  closesNextDay?: boolean;
  dayOfWeek?: DayOfWeek;
  id?: bigint;
  isClosed?: boolean;
  openTime?: string;
  organizationId?: bigint;
} = {}) => ({
  id,
  organizationId,
  dayOfWeek,
  isClosed,
  openTime: isClosed ? null : createTimeDate(openTime),
  closeTime: isClosed ? null : createTimeDate(closeTime),
  closesNextDay,
});

const createOrganization = (
  id = BigInt(1),
  userId = BigInt(1),
  businessHours = [createBusinessHour({ organizationId: id })],
) => ({
  id,
  userId,
  name: "프래그먼트 카페",
  businessHours,
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
  weeklyContractHours = 40,
} = {}) => ({
  id,
  organizationId,
  employeeCode,
  name,
  weeklyContractHours,
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

  it("blocks recommendation when no minimum staffing rule exists", async () => {
    const { prisma } = createFakePrisma({
      activeSchedulePlanningPeriods: [createPlanningPeriod()],
      availableTimes: [createAvailableTime()],
      minimumStaffingRules: [],
      organizations: [createOrganization()],
      workers: [createWorker()],
    });

    await expect(
      recommendSchedule(prisma, "1", {
        startDate: "2026-07-01",
        endDate: "2026-07-01",
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_ERROR,
      statusCode: 400,
    });
  });

  it("creates recommendations only for minimum staffing rule windows", async () => {
    const { prisma } = createFakePrisma({
      activeSchedulePlanningPeriods: [createPlanningPeriod()],
      availableTimes: [
        createAvailableTime(),
        createAvailableTime({
          id: BigInt(2),
          workerId: BigInt(2),
        }),
      ],
      minimumStaffingRules: [
        createMinimumStaffingRule({
          startTime: "12:00",
          endTime: "14:00",
          requiredCount: 2,
        }),
      ],
      organizations: [
        createOrganization(BigInt(1), BigInt(1), [
          createBusinessHour({
            closeTime: "18:00",
            openTime: "09:00",
          }),
        ]),
      ],
      workers: [
        createWorker(),
        createWorker({
          id: BigInt(2),
          employeeCode: "W-0002",
          name: "박지민",
        }),
      ],
    });

    const schedule = await recommendSchedule(prisma, "1", {
      startDate: "2026-07-01",
      endDate: "2026-07-01",
    });

    expect(schedule.assignments).toEqual([
      expect.objectContaining({
        workerId: "1",
        startsAt: "2026-07-01T12:00:00.000Z",
        endsAt: "2026-07-01T14:00:00.000Z",
      }),
      expect.objectContaining({
        workerId: "2",
        startsAt: "2026-07-01T12:00:00.000Z",
        endsAt: "2026-07-01T14:00:00.000Z",
      }),
    ]);
    expect(schedule.workerShortages).toEqual([]);
  });

  it("returns all candidates while marking selected recommendations", async () => {
    const { prisma } = createFakePrisma({
      activeSchedulePlanningPeriods: [createPlanningPeriod()],
      availableTimes: [
        createAvailableTime(),
        createAvailableTime({
          id: BigInt(2),
          workerId: BigInt(2),
        }),
      ],
      minimumStaffingRules: [
        createMinimumStaffingRule({
          requiredCount: 1,
        }),
      ],
      organizations: [createOrganization()],
      workers: [
        createWorker(),
        createWorker({
          id: BigInt(2),
          employeeCode: "W-0002",
          name: "박지민",
        }),
      ],
    });

    const schedule = await recommendSchedule(prisma, "1", {
      startDate: "2026-07-01",
      endDate: "2026-07-01",
    });

    expect(schedule.assignments).toHaveLength(1);
    expect(schedule.candidates).toEqual([
      expect.objectContaining({
        workerId: "1",
        startsAt: "2026-07-01T10:00:00.000Z",
        endsAt: "2026-07-01T14:00:00.000Z",
        isRecommended: true,
      }),
      expect.objectContaining({
        workerId: "2",
        startsAt: "2026-07-01T10:00:00.000Z",
        endsAt: "2026-07-01T14:00:00.000Z",
        isRecommended: false,
      }),
    ]);
  });

  it("splits recommendation windows by availability boundaries inside a staffing rule", async () => {
    const { prisma } = createFakePrisma({
      activeSchedulePlanningPeriods: [createPlanningPeriod()],
      availableTimes: [
        createAvailableTime({
          endsAt: "2026-07-01T11:00:00.000Z",
          startsAt: "2026-07-01T09:00:00.000Z",
        }),
        createAvailableTime({
          id: BigInt(2),
          workerId: BigInt(2),
          endsAt: "2026-07-01T11:00:00.000Z",
          startsAt: "2026-07-01T09:00:00.000Z",
        }),
        createAvailableTime({
          id: BigInt(3),
          workerId: BigInt(2),
          endsAt: "2026-07-01T16:00:00.000Z",
          startsAt: "2026-07-01T12:00:00.000Z",
        }),
      ],
      minimumStaffingRules: [
        createMinimumStaffingRule({
          endTime: "16:00",
          requiredCount: 2,
          startTime: "09:00",
        }),
      ],
      organizations: [
        createOrganization(BigInt(1), BigInt(1), [
          createBusinessHour({
            closeTime: "16:00",
            openTime: "09:00",
          }),
        ]),
      ],
      workers: [
        createWorker(),
        createWorker({
          id: BigInt(2),
          employeeCode: "W-0002",
          name: "박지민",
        }),
      ],
    });

    const schedule = await recommendSchedule(prisma, "1", {
      startDate: "2026-07-01",
      endDate: "2026-07-01",
    });

    expect(schedule.candidates).toEqual([
      expect.objectContaining({
        workerId: "1",
        startsAt: "2026-07-01T09:00:00.000Z",
        endsAt: "2026-07-01T11:00:00.000Z",
        isRecommended: true,
      }),
      expect.objectContaining({
        workerId: "2",
        startsAt: "2026-07-01T09:00:00.000Z",
        endsAt: "2026-07-01T11:00:00.000Z",
        isRecommended: true,
      }),
      expect.objectContaining({
        workerId: "2",
        startsAt: "2026-07-01T12:00:00.000Z",
        endsAt: "2026-07-01T16:00:00.000Z",
        isRecommended: true,
      }),
    ]);
    expect(schedule.assignments).toEqual([
      expect.objectContaining({
        workerId: "1",
        startsAt: "2026-07-01T09:00:00.000Z",
        endsAt: "2026-07-01T11:00:00.000Z",
      }),
      expect.objectContaining({
        workerId: "2",
        startsAt: "2026-07-01T09:00:00.000Z",
        endsAt: "2026-07-01T11:00:00.000Z",
      }),
      expect.objectContaining({
        workerId: "2",
        startsAt: "2026-07-01T12:00:00.000Z",
        endsAt: "2026-07-01T16:00:00.000Z",
      }),
    ]);
    expect(schedule.workerShortages).toEqual([
      expect.objectContaining({
        startTime: "11:00",
        endTime: "12:00",
        requiredCount: 2,
        assignedCount: 0,
      }),
      expect.objectContaining({
        startTime: "12:00",
        endTime: "16:00",
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
      organizations: [
        createOrganization(BigInt(1), BigInt(1), [
          createBusinessHour({
            closeTime: "02:00",
            closesNextDay: true,
            dayOfWeek: "FRI",
            openTime: "22:00",
          }),
        ]),
      ],
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

describe("getDraftSchedule", () => {
  it("returns the latest draft schedule for the same period", async () => {
    const { prisma } = createFakePrisma({
      schedules: [createDraftSchedule({ id: BigInt(1) }), createDraftSchedule({ id: BigInt(2) })],
    });

    await expect(
      getDraftSchedule(prisma, "1", {
        startDate: "2026-07-01",
        endDate: "2026-07-01",
      }),
    ).resolves.toMatchObject({
      schedule: {
        id: "2",
      },
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
