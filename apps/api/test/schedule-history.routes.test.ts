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
      .get("/api/schedule-history/1/export.csv")
      .set("Authorization", authHeader());

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/csv");
    expect(response.text).toBe(
      ["날짜,요일,시작시간,종료시간,사번,근무자명", "2026-07-01,수,10:00,14:00,W-0001,김민수"].join(
        "\n",
      ),
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
