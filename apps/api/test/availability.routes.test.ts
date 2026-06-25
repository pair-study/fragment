import { beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";

import { createApp } from "@/app";
import { createAccessToken } from "@/modules/auth/auth.tokens";
import { createFakePrisma } from "./helpers/fake-prisma";

const createOrganization = () => ({
  id: BigInt(1),
  userId: BigInt(1),
  name: "프래그먼트 카페",
  businessHours: [],
});

const createWorker = () => ({
  id: BigInt(1),
  organizationId: BigInt(1),
  employeeCode: "W-0001",
  name: "김민수",
  weeklyContractHours: 40,
});

const now = new Date("2026-06-25T00:00:00.000Z");

describe("availability routes", () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    delete process.env.JWT_ACCESS_EXPIRES_IN;
    delete process.env.WEB_APP_ORIGIN;
  });

  const authHeader = () => `Bearer ${createAccessToken(BigInt(1))}`;

  it("requires authentication", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });

    const response = await request(app).get("/api/availability").query({
      workerId: "1",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      errorCode: "UNAUTHORIZED",
      statusCode: 401,
    });
  });

  it("rejects invalid query", async () => {
    const { prisma } = createFakePrisma({
      organizations: [createOrganization()],
      workers: [createWorker()],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/api/availability")
      .set("Authorization", authHeader())
      .query({
        workerId: "1",
        startDate: "2026-08-01",
        endDate: "2026-07-31",
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      errorCode: "VALIDATION_ERROR",
      statusCode: 400,
    });
  });

  it("lists availability by worker and date range ordered by date and start time", async () => {
    const { prisma } = createFakePrisma({
      availableTimes: [
        {
          id: BigInt(3),
          workerId: BigInt(1),
          availableDate: new Date("2026-08-01T00:00:00.000Z"),
          startsAt: new Date("2026-08-01T09:00:00.000Z"),
          endsAt: new Date("2026-08-01T12:00:00.000Z"),
          createdAt: now,
          updatedAt: now,
        },
        {
          id: BigInt(2),
          workerId: BigInt(1),
          availableDate: new Date("2026-07-01T00:00:00.000Z"),
          startsAt: new Date("2026-07-01T14:00:00.000Z"),
          endsAt: new Date("2026-07-01T18:00:00.000Z"),
          createdAt: now,
          updatedAt: now,
        },
        {
          id: BigInt(1),
          workerId: BigInt(1),
          availableDate: new Date("2026-07-01T00:00:00.000Z"),
          startsAt: new Date("2026-07-01T10:00:00.000Z"),
          endsAt: new Date("2026-07-01T12:00:00.000Z"),
          createdAt: now,
          updatedAt: now,
        },
      ],
      organizations: [createOrganization()],
      workers: [createWorker()],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/api/availability")
      .set("Authorization", authHeader())
      .query({
        workerId: "1",
        startDate: "2026-07-01",
        endDate: "2026-07-31",
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [
        {
          id: "1",
          workerId: "1",
          availableDate: "2026-07-01",
          startsAt: "2026-07-01T10:00:00.000Z",
          endsAt: "2026-07-01T12:00:00.000Z",
        },
        {
          id: "2",
          workerId: "1",
          availableDate: "2026-07-01",
          startsAt: "2026-07-01T14:00:00.000Z",
          endsAt: "2026-07-01T18:00:00.000Z",
        },
      ],
    });
  });

  it("rejects invalid bulk save body", async () => {
    const { prisma } = createFakePrisma({
      organizations: [createOrganization()],
      workers: [createWorker()],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .put("/api/availability/bulk")
      .set("Authorization", authHeader())
      .send({
        workerId: "1",
        startDate: "2026-07-31",
        endDate: "2026-07-01",
        items: [],
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      errorCode: "VALIDATION_ERROR",
      statusCode: 400,
    });
  });

  it("replaces availability for the selected date range", async () => {
    const { prisma } = createFakePrisma({
      availableTimes: [
        {
          id: BigInt(1),
          workerId: BigInt(1),
          availableDate: new Date("2026-07-01T00:00:00.000Z"),
          startsAt: new Date("2026-07-01T10:00:00.000Z"),
          endsAt: new Date("2026-07-01T12:00:00.000Z"),
          createdAt: now,
          updatedAt: now,
        },
      ],
      organizations: [createOrganization()],
      workers: [createWorker()],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .put("/api/availability/bulk")
      .set("Authorization", authHeader())
      .send({
        workerId: "1",
        startDate: "2026-07-01",
        endDate: "2026-07-31",
        items: [
          {
            availableDate: "2026-07-02",
            startsAt: "2026-07-02T09:00:00.000Z",
            endsAt: "2026-07-02T12:00:00.000Z",
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [
        {
          id: "2",
          workerId: "1",
          availableDate: "2026-07-02",
          startsAt: "2026-07-02T09:00:00.000Z",
          endsAt: "2026-07-02T12:00:00.000Z",
        },
      ],
    });
  });
});
