import { beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";

import { createApp } from "@/app";
import { createAccessToken } from "@/modules/auth/auth.tokens";
import { createFakePrisma } from "./helpers/fake-prisma";

const timestamp = new Date("2026-06-25T00:00:00.000Z");
const dateOnly = (date: string) => new Date(`${date}T00:00:00.000Z`);

const createOrganization = () => ({
  id: BigInt(1),
  userId: BigInt(1),
  name: "프래그먼트 카페",
  businessHours: [],
});

const createSchedule = ({
  confirmedAt,
  endDate,
  id,
  startDate,
  status = "CONFIRMED",
}: {
  confirmedAt: Date | null;
  endDate: string;
  id: bigint;
  startDate: string;
  status?: "DRAFT" | "CONFIRMED";
}) => ({
  id,
  organizationId: BigInt(1),
  status,
  inputHash: `hash-${id.toString()}`,
  startDate: dateOnly(startDate),
  endDate: dateOnly(endDate),
  generatedAt: timestamp,
  confirmedAt,
  createdAt: timestamp,
  updatedAt: timestamp,
});

const createAssignment = ({
  employeeCodeSnapshot = "W-0001",
  endsAt = "2026-07-01T14:00:00.000Z",
  id = BigInt(10),
  startsAt = "2026-07-01T10:00:00.000Z",
  workerId = BigInt(1),
  workerNameSnapshot = "김민수",
  workDate = "2026-07-01",
}: {
  employeeCodeSnapshot?: string;
  endsAt?: string;
  id?: bigint;
  startsAt?: string;
  workerId?: bigint;
  workerNameSnapshot?: string;
  workDate?: string;
} = {}) => ({
  id,
  scheduleId: BigInt(1),
  workerId,
  workDate: dateOnly(workDate),
  startsAt: new Date(startsAt),
  endsAt: new Date(endsAt),
  workerNameSnapshot,
  employeeCodeSnapshot,
  createdAt: timestamp,
  updatedAt: timestamp,
});

describe("schedule history routes", () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    delete process.env.JWT_ACCESS_EXPIRES_IN;
    delete process.env.WEB_APP_ORIGIN;
  });

  const authHeader = () => `Bearer ${createAccessToken(BigInt(1))}`;

  it("requires authentication", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });

    const response = await request(app).get("/api/schedule-history?year=2026");

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
      .get("/api/schedule-history?year=2026")
      .set("Authorization", authHeader());

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      errorCode: "ORGANIZATION_REQUIRED",
      statusCode: 403,
    });
  });

  it("lists confirmed schedules overlapping the requested month", async () => {
    const { prisma } = createFakePrisma({
      organizations: [createOrganization()],
      schedules: [
        createSchedule({
          id: BigInt(1),
          startDate: "2026-06-25",
          endDate: "2026-07-05",
          confirmedAt: new Date("2026-06-20T00:00:00.000Z"),
        }),
        createSchedule({
          id: BigInt(2),
          startDate: "2026-08-01",
          endDate: "2026-08-31",
          confirmedAt: new Date("2026-07-01T00:00:00.000Z"),
        }),
        createSchedule({
          id: BigInt(3),
          startDate: "2026-07-10",
          endDate: "2026-07-20",
          confirmedAt: new Date("2026-06-21T00:00:00.000Z"),
        }),
        createSchedule({
          id: BigInt(4),
          startDate: "2026-07-01",
          endDate: "2026-07-01",
          confirmedAt: null,
          status: "DRAFT",
        }),
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/api/schedule-history?year=2026&month=7")
      .set("Authorization", authHeader());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [
        {
          id: "3",
          startDate: "2026-07-10",
          endDate: "2026-07-20",
          confirmedAt: "2026-06-21T00:00:00.000Z",
        },
        {
          id: "1",
          startDate: "2026-06-25",
          endDate: "2026-07-05",
          confirmedAt: "2026-06-20T00:00:00.000Z",
        },
      ],
    });
  });

  it("returns an empty list when there is no matching confirmed schedule", async () => {
    const { prisma } = createFakePrisma({
      organizations: [createOrganization()],
      schedules: [
        createSchedule({
          id: BigInt(1),
          startDate: "2026-06-01",
          endDate: "2026-06-30",
          confirmedAt: new Date("2026-06-20T00:00:00.000Z"),
        }),
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/api/schedule-history?year=2026&month=7")
      .set("Authorization", authHeader());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [] });
  });

  it("returns confirmed schedule detail", async () => {
    const { prisma } = createFakePrisma({
      organizations: [createOrganization()],
      scheduleAssignments: [createAssignment()],
      schedules: [
        createSchedule({
          id: BigInt(1),
          startDate: "2026-07-01",
          endDate: "2026-07-31",
          confirmedAt: new Date("2026-06-25T00:00:00.000Z"),
        }),
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/api/schedule-history/1")
      .set("Authorization", authHeader());

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: "1",
      status: "CONFIRMED",
      confirmedAt: "2026-06-25T00:00:00.000Z",
      assignments: [
        {
          id: "10",
          employeeCodeSnapshot: "W-0001",
          workerNameSnapshot: "김민수",
        },
      ],
    });
  });

  it("exports confirmed schedule assignments as csv", async () => {
    const { prisma } = createFakePrisma({
      organizations: [createOrganization()],
      scheduleAssignments: [
        createAssignment(),
        createAssignment({
          id: BigInt(11),
          workerId: BigInt(2),
          workerNameSnapshot: "이서연",
        }),
        createAssignment({
          id: BigInt(12),
          startsAt: "2026-07-02T15:00:00.000Z",
          endsAt: "2026-07-02T18:00:00.000Z",
          workerId: BigInt(3),
          workerNameSnapshot: "박준호",
          workDate: "2026-07-02",
        }),
      ],
      schedules: [
        createSchedule({
          id: BigInt(1),
          startDate: "2026-07-01",
          endDate: "2026-07-03",
          confirmedAt: new Date("2026-06-25T00:00:00.000Z"),
        }),
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/api/schedule-history/1/export.csv")
      .set("Authorization", authHeader());

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/csv");
    expect(response.text).toBe(
      `\uFEFF${[
        "날짜,요일,10:00-14:00,15:00-18:00",
        "2026-07-01,수,김민수 / 이서연,",
        "2026-07-02,목,,박준호",
        "2026-07-03,금,,",
      ].join("\n")}`,
    );
  });

  it("returns 404 when exporting a non-confirmed schedule", async () => {
    const { prisma } = createFakePrisma({
      organizations: [createOrganization()],
      schedules: [
        createSchedule({
          id: BigInt(1),
          startDate: "2026-07-01",
          endDate: "2026-07-31",
          confirmedAt: null,
          status: "DRAFT",
        }),
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/api/schedule-history/1/export.csv")
      .set("Authorization", authHeader());

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      errorCode: "SCHEDULE_NOT_FOUND",
      statusCode: 404,
    });
  });
});
