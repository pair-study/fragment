import { beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";

import { createApp } from "@/app";
import { createAccessToken } from "@/modules/auth/auth.tokens";
import { createFakePrisma } from "./helpers/fake-prisma";

const timestamp = new Date("2026-06-25T00:00:00.000Z");
const dateOnly = (date: string) => new Date(`${date}T00:00:00.000Z`);

const createOrganization = ({
  id = BigInt(1),
  name = "프래그먼트 카페",
  userId = BigInt(1),
}: {
  id?: bigint;
  name?: string;
  userId?: bigint;
} = {}) => ({
  id,
  userId,
  name,
  businessHours: [],
});

const createSchedule = ({
  confirmedAt,
  endDate,
  id,
  organizationId = BigInt(1),
  startDate,
  status = "CONFIRMED",
}: {
  confirmedAt: Date | null;
  endDate: string;
  id: bigint;
  organizationId?: bigint;
  startDate: string;
  status?: "DRAFT" | "CONFIRMED";
}) => ({
  id,
  organizationId,
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
  scheduleId = BigInt(1),
  startsAt = "2026-07-01T10:00:00.000Z",
  workerId = BigInt(1),
  workerNameSnapshot = "김민수",
  workDate = "2026-07-01",
}: {
  employeeCodeSnapshot?: string;
  endsAt?: string;
  id?: bigint;
  scheduleId?: bigint;
  startsAt?: string;
  workerId?: bigint;
  workerNameSnapshot?: string;
  workDate?: string;
} = {}) => ({
  id,
  scheduleId,
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

  it("rejects invalid history query", async () => {
    const { prisma } = createFakePrisma({
      organizations: [createOrganization()],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/api/schedule-history?year=2026&month=13")
      .set("Authorization", authHeader());

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      errorCode: "VALIDATION_ERROR",
      statusCode: 400,
    });
  });

  it("rejects invalid history detail id", async () => {
    const { prisma } = createFakePrisma({
      organizations: [createOrganization()],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/api/schedule-history/not-a-number")
      .set("Authorization", authHeader());

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      errorCode: "VALIDATION_ERROR",
      statusCode: 400,
    });
  });

  it("lists all confirmed schedules when year is omitted", async () => {
    const { prisma } = createFakePrisma({
      organizations: [createOrganization()],
      schedules: [
        createSchedule({
          id: BigInt(1),
          startDate: "2025-12-20",
          endDate: "2026-01-05",
          confirmedAt: new Date("2025-12-15T00:00:00.000Z"),
        }),
        createSchedule({
          id: BigInt(2),
          startDate: "2026-07-01",
          endDate: "2026-07-31",
          confirmedAt: new Date("2026-06-20T00:00:00.000Z"),
        }),
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/api/schedule-history")
      .set("Authorization", authHeader());

    expect(response.status).toBe(200);
    expect(response.body.items.map((item: { id: string }) => item.id)).toEqual(["2", "1"]);
  });

  it("lists confirmed schedules overlapping the requested month", async () => {
    const { prisma } = createFakePrisma({
      organizations: [
        createOrganization(),
        createOrganization({
          id: BigInt(2),
          name: "다른 매장",
          userId: BigInt(2),
        }),
      ],
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
        createSchedule({
          id: BigInt(5),
          organizationId: BigInt(2),
          startDate: "2026-07-01",
          endDate: "2026-07-31",
          confirmedAt: new Date("2026-06-30T00:00:00.000Z"),
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
      organizations: [
        createOrganization(),
        createOrganization({
          id: BigInt(2),
          name: "다른 매장",
          userId: BigInt(2),
        }),
      ],
      scheduleAssignments: [
        createAssignment(),
        createAssignment({
          id: BigInt(11),
          scheduleId: BigInt(2),
          workerNameSnapshot: "외부 근무자",
        }),
      ],
      schedules: [
        createSchedule({
          id: BigInt(1),
          startDate: "2026-07-01",
          endDate: "2026-07-31",
          confirmedAt: new Date("2026-06-25T00:00:00.000Z"),
        }),
        createSchedule({
          id: BigInt(2),
          organizationId: BigInt(2),
          startDate: "2026-07-01",
          endDate: "2026-07-31",
          confirmedAt: new Date("2026-06-30T00:00:00.000Z"),
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

  it("returns 404 when requesting another organization's schedule detail", async () => {
    const { prisma } = createFakePrisma({
      organizations: [
        createOrganization(),
        createOrganization({
          id: BigInt(2),
          name: "다른 매장",
          userId: BigInt(2),
        }),
      ],
      schedules: [
        createSchedule({
          id: BigInt(2),
          organizationId: BigInt(2),
          startDate: "2026-07-01",
          endDate: "2026-07-31",
          confirmedAt: new Date("2026-06-30T00:00:00.000Z"),
        }),
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/api/schedule-history/2")
      .set("Authorization", authHeader());

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      errorCode: "SCHEDULE_NOT_FOUND",
      statusCode: 404,
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
        createAssignment({
          id: BigInt(13),
          startsAt: "2026-07-03T07:00:00.000Z",
          endsAt: "2026-07-03T09:00:00.000Z",
          workerId: BigInt(4),
          workerNameSnapshot: '=HYPERLINK("https://example.com")',
          workDate: "2026-07-03",
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
        "날짜,요일,07:00-09:00,10:00-14:00,15:00-18:00",
        "2026-07-01,수,,김민수 / 이서연,",
        "2026-07-02,목,,,박준호",
        '2026-07-03,금,"\'=HYPERLINK(""https://example.com"")",,',
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

  it("returns 404 when exporting another organization's schedule", async () => {
    const { prisma } = createFakePrisma({
      organizations: [
        createOrganization(),
        createOrganization({
          id: BigInt(2),
          name: "다른 매장",
          userId: BigInt(2),
        }),
      ],
      schedules: [
        createSchedule({
          id: BigInt(2),
          organizationId: BigInt(2),
          startDate: "2026-07-01",
          endDate: "2026-07-31",
          confirmedAt: new Date("2026-06-30T00:00:00.000Z"),
        }),
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/api/schedule-history/2/export.csv")
      .set("Authorization", authHeader());

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      errorCode: "SCHEDULE_NOT_FOUND",
      statusCode: 404,
    });
  });
});
