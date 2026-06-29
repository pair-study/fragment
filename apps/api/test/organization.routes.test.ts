import { describe, expect, it, beforeEach } from "@jest/globals";
import request from "supertest";

import { createApp } from "@/app";
import { createAccessToken } from "@/modules/auth/auth.tokens";
import { createBusinessHoursInput } from "./helpers/organization-fixtures";
import { createFakePrisma, createTimeDate } from "./helpers/fake-prisma";

describe("organization routes", () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    delete process.env.JWT_ACCESS_EXPIRES_IN;
    delete process.env.WEB_APP_ORIGIN;
  });

  const authHeader = () => `Bearer ${createAccessToken(BigInt(1))}`;

  it("requires authentication when creating an organization", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });

    const response = await request(app).post("/api/organization").send({
      name: "프래그먼트 카페",
      businessHours: createBusinessHoursInput(),
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      errorCode: "UNAUTHORIZED",
      statusCode: 401,
    });
  });

  it("rejects invalid organization input", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });

    const response = await request(app)
      .post("/api/organization")
      .set("Authorization", authHeader())
      .send({
        name: "",
        businessHours: [],
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      errorCode: "VALIDATION_ERROR",
      statusCode: 400,
    });
  });

  it("creates an organization and derives overnight business hours", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });

    const response = await request(app)
      .post("/api/organization")
      .set("Authorization", authHeader())
      .send({
        name: "프래그먼트 카페",
        businessHours: createBusinessHoursInput({
          FRI: {
            openTime: "22:00",
            closeTime: "02:00",
          },
          SUN: {
            isClosed: true,
            openTime: null,
            closeTime: null,
          },
        }).reverse(),
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: "1",
      name: "프래그먼트 카페",
    });
    expect(response.body.businessHours).toHaveLength(7);
    expect(
      response.body.businessHours.map(
        (businessHour: { dayOfWeek: string }) => businessHour.dayOfWeek,
      ),
    ).toEqual(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);
    expect(response.body.businessHours[4]).toMatchObject({
      dayOfWeek: "FRI",
      openTime: "22:00",
      closeTime: "02:00",
      closesNextDay: true,
    });
    expect(response.body.businessHours[6]).toMatchObject({
      dayOfWeek: "SUN",
      isClosed: true,
      openTime: null,
      closeTime: null,
      closesNextDay: false,
    });
  });

  it("prevents creating a second organization for the same user", async () => {
    const { prisma } = createFakePrisma({
      organizations: [
        {
          id: BigInt(1),
          userId: BigInt(1),
          name: "기존 조직",
          businessHours: [],
        },
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .post("/api/organization")
      .set("Authorization", authHeader())
      .send({
        name: "프래그먼트 카페",
        businessHours: createBusinessHoursInput(),
      });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      errorCode: "ORGANIZATION_ALREADY_EXISTS",
      statusCode: 409,
    });
  });

  it("returns the authenticated user's organization", async () => {
    const { prisma } = createFakePrisma({
      organizations: [
        {
          id: BigInt(1),
          userId: BigInt(1),
          name: "프래그먼트 카페",
          businessHours: [
            {
              id: BigInt(1),
              organizationId: BigInt(1),
              dayOfWeek: "MON",
              isClosed: false,
              openTime: createTimeDate("09:00"),
              closeTime: createTimeDate("18:00"),
              closesNextDay: false,
            },
          ],
        },
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app).get("/api/organization").set("Authorization", authHeader());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: "1",
      name: "프래그먼트 카페",
      businessHours: [
        {
          id: "1",
          dayOfWeek: "MON",
          isClosed: false,
          openTime: "09:00",
          closeTime: "18:00",
          closesNextDay: false,
        },
      ],
    });
  });

  it("updates an existing organization", async () => {
    const { prisma } = createFakePrisma({
      organizations: [
        {
          id: BigInt(1),
          userId: BigInt(1),
          name: "기존 조직",
          businessHours: [],
        },
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .patch("/api/organization")
      .set("Authorization", authHeader())
      .send({
        name: "수정된 조직",
        businessHours: createBusinessHoursInput({
          SUN: {
            isClosed: true,
            openTime: null,
            closeTime: null,
          },
        }),
      });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("수정된 조직");
    expect(response.body.businessHours).toHaveLength(7);
    expect(response.body.businessHours[6]).toMatchObject({
      dayOfWeek: "SUN",
      isClosed: true,
      openTime: null,
      closeTime: null,
    });
  });

  it("returns null when there is no active planning period", async () => {
    const { prisma } = createFakePrisma({
      organizations: [
        {
          id: BigInt(1),
          userId: BigInt(1),
          name: "프래그먼트 카페",
          businessHours: [],
        },
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/api/organization/active-schedule-planning-period")
      .set("Authorization", authHeader());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      period: null,
    });
  });

  it("upserts and returns the active planning period", async () => {
    const { prisma } = createFakePrisma({
      organizations: [
        {
          id: BigInt(1),
          userId: BigInt(1),
          name: "프래그먼트 카페",
          businessHours: [],
        },
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .put("/api/organization/active-schedule-planning-period")
      .set("Authorization", authHeader())
      .send({
        startDate: "2026-07-01",
        endDate: "2026-07-31",
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: "1",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
    });
  });

  it("rejects an invalid active planning period date range", async () => {
    const { prisma } = createFakePrisma({
      organizations: [
        {
          id: BigInt(1),
          userId: BigInt(1),
          name: "프래그먼트 카페",
          businessHours: [],
        },
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .put("/api/organization/active-schedule-planning-period")
      .set("Authorization", authHeader())
      .send({
        startDate: "2026-08-01",
        endDate: "2026-07-31",
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      errorCode: "VALIDATION_ERROR",
      statusCode: 400,
    });
  });

  it("deletes the active planning period", async () => {
    const now = new Date("2026-06-25T00:00:00.000Z");
    const { prisma } = createFakePrisma({
      activeSchedulePlanningPeriods: [
        {
          id: BigInt(1),
          organizationId: BigInt(1),
          startDate: new Date("2026-07-01T00:00:00.000Z"),
          endDate: new Date("2026-07-31T00:00:00.000Z"),
          createdAt: now,
          updatedAt: now,
        },
      ],
      organizations: [
        {
          id: BigInt(1),
          userId: BigInt(1),
          name: "프래그먼트 카페",
          businessHours: [],
        },
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app)
      .delete("/api/organization/active-schedule-planning-period")
      .set("Authorization", authHeader());

    expect(response.status).toBe(204);
  });
});
