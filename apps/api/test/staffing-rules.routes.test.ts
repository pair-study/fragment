import { beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";

import { createApp } from "@/app";
import { createAccessToken } from "@/modules/auth/auth.tokens";
import { createFakePrisma, createTimeDate } from "./helpers/fake-prisma";

const now = new Date("2026-06-25T00:00:00.000Z");

const createOrganization = (
  businessHours = [
    {
      id: BigInt(1),
      organizationId: BigInt(1),
      dayOfWeek: "WED" as const,
      isClosed: false,
      openTime: createTimeDate("09:00"),
      closeTime: createTimeDate("18:00"),
      closesNextDay: false,
    },
  ],
) => ({
  id: BigInt(1),
  userId: BigInt(1),
  name: "프래그먼트 카페",
  businessHours,
});

describe("staffing rules routes", () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    delete process.env.JWT_ACCESS_EXPIRES_IN;
    delete process.env.WEB_APP_ORIGIN;
  });

  const authHeader = () => `Bearer ${createAccessToken(BigInt(1))}`;

  it("requires authentication", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });

    const response = await request(app).get("/api/staffing-rules");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      errorCode: "UNAUTHORIZED",
      statusCode: 401,
    });
  });

  it("rejects invalid create input", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });

    const response = await request(app)
      .post("/api/staffing-rules")
      .set("Authorization", authHeader())
      .send({
        dayOfWeek: "MON",
        startTime: "14:00",
        endTime: "10:00",
        endsNextDay: false,
        requiredCount: 0,
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      errorCode: "VALIDATION_ERROR",
      statusCode: 400,
    });
  });

  it("returns the authenticated user's staffing rules", async () => {
    const { prisma } = createFakePrisma({
      minimumStaffingRules: [
        {
          id: BigInt(10),
          organizationId: BigInt(1),
          dayOfWeek: "MON",
          startTime: createTimeDate("09:30"),
          endTime: createTimeDate("14:00"),
          endsNextDay: false,
          requiredCount: 2,
          createdAt: now,
          updatedAt: now,
        },
      ],
      organizations: [createOrganization()],
    });
    const app = createApp({
      prisma,
    });

    const response = await request(app)
      .get("/api/staffing-rules")
      .set("Authorization", authHeader());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [
        {
          id: "10",
          dayOfWeek: "MON",
          startTime: "09:30",
          endTime: "14:00",
          endsNextDay: false,
          requiredCount: 2,
        },
      ],
    });
  });

  it("prunes availability when a staffing rule is deleted", async () => {
    const { prisma } = createFakePrisma({
      activeSchedulePlanningPeriods: [
        {
          id: BigInt(1),
          organizationId: BigInt(1),
          startDate: new Date("2026-07-01T00:00:00.000Z"),
          endDate: new Date("2026-07-01T00:00:00.000Z"),
          createdAt: now,
          updatedAt: now,
        },
      ],
      availableTimes: [
        {
          id: BigInt(1),
          workerId: BigInt(1),
          availableDate: new Date("2026-07-01T00:00:00.000Z"),
          startsAt: new Date("2026-07-01T12:00:00.000Z"),
          endsAt: new Date("2026-07-01T14:00:00.000Z"),
          createdAt: now,
          updatedAt: now,
        },
      ],
      minimumStaffingRules: [
        {
          id: BigInt(10),
          organizationId: BigInt(1),
          dayOfWeek: "WED",
          startTime: createTimeDate("12:00"),
          endTime: createTimeDate("14:00"),
          endsNextDay: false,
          requiredCount: 1,
          createdAt: now,
          updatedAt: now,
        },
      ],
      organizations: [createOrganization()],
      workers: [
        {
          id: BigInt(1),
          organizationId: BigInt(1),
          employeeCode: "W-0001",
          name: "김민수",
          weeklyContractHours: 40,
        },
      ],
    });
    const app = createApp({ prisma });

    const deleteResponse = await request(app)
      .delete("/api/staffing-rules/10")
      .set("Authorization", authHeader());

    expect(deleteResponse.status).toBe(204);

    const availabilityResponse = await request(app)
      .get("/api/availability")
      .set("Authorization", authHeader())
      .query({
        workerId: "1",
        startDate: "2026-07-01",
        endDate: "2026-07-01",
      });

    expect(availabilityResponse.status).toBe(200);
    expect(availabilityResponse.body).toEqual({
      items: [],
    });
  });
});
