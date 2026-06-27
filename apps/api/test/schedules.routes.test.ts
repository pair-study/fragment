import { beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";

import { createApp } from "@/app";
import { createAccessToken } from "@/modules/auth/auth.tokens";
import { createFakePrisma, createTimeDate } from "./helpers/fake-prisma";

const timestamp = new Date("2026-06-25T00:00:00.000Z");
const dateOnly = (date: string) => new Date(`${date}T00:00:00.000Z`);

const createOrganization = () => ({
  id: BigInt(1),
  userId: BigInt(1),
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

const createWorker = () => ({
  id: BigInt(1),
  organizationId: BigInt(1),
  employeeCode: "W-0001",
  name: "김민수",
  weeklyContractHours: 40,
});

const createAvailableTime = () => ({
  id: BigInt(1),
  workerId: BigInt(1),
  availableDate: dateOnly("2026-07-01"),
  startsAt: new Date("2026-07-01T09:00:00.000Z"),
  endsAt: new Date("2026-07-01T18:00:00.000Z"),
  createdAt: timestamp,
  updatedAt: timestamp,
});

const createMinimumStaffingRule = () => ({
  id: BigInt(1),
  organizationId: BigInt(1),
  dayOfWeek: "WED" as const,
  startTime: createTimeDate("10:00"),
  endTime: createTimeDate("14:00"),
  endsNextDay: false,
  requiredCount: 1,
  createdAt: timestamp,
  updatedAt: timestamp,
});

const createDraftSchedule = () => ({
  id: BigInt(1),
  organizationId: BigInt(1),
  status: "DRAFT" as const,
  inputHash: "hash-1",
  startDate: dateOnly("2026-07-01"),
  endDate: dateOnly("2026-07-01"),
  generatedAt: timestamp,
  confirmedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
});

describe("schedules routes", () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    delete process.env.JWT_ACCESS_EXPIRES_IN;
    delete process.env.WEB_APP_ORIGIN;
  });

  const authHeader = () => `Bearer ${createAccessToken(BigInt(1))}`;

  it("requires authentication", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });

    const response = await request(app).post("/api/schedules/recommend").send({
      startDate: "2026-07-01",
      endDate: "2026-07-01",
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      errorCode: "UNAUTHORIZED",
      statusCode: 401,
    });
  });

  it("requires an organization", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/api/schedules/draft?startDate=2026-07-01&endDate=2026-07-01")
      .set("Authorization", authHeader());

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      errorCode: "ORGANIZATION_REQUIRED",
      statusCode: 403,
    });
  });

  it("rejects invalid recommendation input", async () => {
    const { prisma } = createFakePrisma({
      organizations: [createOrganization()],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .post("/api/schedules/recommend")
      .set("Authorization", authHeader())
      .send({
        startDate: "2026-07-02",
        endDate: "2026-07-01",
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      errorCode: "VALIDATION_ERROR",
      statusCode: 400,
    });
  });

  it("creates and returns a recommended DRAFT schedule", async () => {
    const { prisma } = createFakePrisma({
      activeSchedulePlanningPeriods: [createPlanningPeriod()],
      availableTimes: [createAvailableTime()],
      minimumStaffingRules: [createMinimumStaffingRule()],
      organizations: [createOrganization()],
      workers: [createWorker()],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .post("/api/schedules/recommend")
      .set("Authorization", authHeader())
      .send({
        startDate: "2026-07-01",
        endDate: "2026-07-01",
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: "1",
      status: "DRAFT",
      startDate: "2026-07-01",
      endDate: "2026-07-01",
      assignments: [
        {
          workerId: "1",
          workDate: "2026-07-01",
          workerNameSnapshot: "김민수",
          employeeCodeSnapshot: "W-0001",
        },
      ],
      workerShortages: [],
    });
  });

  it("returns an existing DRAFT schedule for the requested period", async () => {
    const { prisma } = createFakePrisma({
      organizations: [createOrganization()],
      scheduleAssignments: [
        {
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
        },
      ],
      schedules: [createDraftSchedule()],
      workers: [createWorker()],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/api/schedules/draft?startDate=2026-07-01&endDate=2026-07-01")
      .set("Authorization", authHeader());

    expect(response.status).toBe(200);
    expect(response.body.schedule).toMatchObject({
      id: "1",
      status: "DRAFT",
      assignments: [
        {
          id: "10",
          workerId: "1",
        },
      ],
    });
  });

  it("adds an assignment and confirms the DRAFT schedule", async () => {
    const { prisma } = createFakePrisma({
      organizations: [createOrganization()],
      schedules: [createDraftSchedule()],
      workers: [createWorker()],
    });
    const app = createApp({ prisma });

    const assignmentResponse = await request(app)
      .post("/api/schedules/1/assignments")
      .set("Authorization", authHeader())
      .send({
        workerId: "1",
        workDate: "2026-07-01",
        startsAt: "2026-07-01T10:00:00.000Z",
        endsAt: "2026-07-01T14:00:00.000Z",
      });

    expect(assignmentResponse.status).toBe(201);
    expect(assignmentResponse.body).toMatchObject({
      id: "1",
      scheduleId: "1",
      workerId: "1",
      workerNameSnapshot: "김민수",
    });

    const confirmResponse = await request(app)
      .post("/api/schedules/1/confirm")
      .set("Authorization", authHeader());

    expect(confirmResponse.status).toBe(200);
    expect(confirmResponse.body).toMatchObject({
      id: "1",
      status: "CONFIRMED",
      assignments: [
        {
          id: "1",
          workerId: "1",
        },
      ],
    });
  });
});
