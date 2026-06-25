import { beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";

import { createApp } from "@/app";
import { createAccessToken } from "@/modules/auth/auth.tokens";
import { createFakePrisma, createTimeDate } from "./helpers/fake-prisma";

const createOrganization = () => ({
  id: BigInt(1),
  userId: BigInt(1),
  name: "프래그먼트 카페",
  businessHours: [],
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
    const now = new Date("2026-06-25T00:00:00.000Z");
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
});
