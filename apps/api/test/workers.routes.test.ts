import { beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";

import { createApp } from "@/app";
import { createAccessToken } from "@/modules/auth/auth.tokens";
import { createFakePrisma } from "./helpers/fake-prisma";

describe("workers routes", () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    delete process.env.JWT_ACCESS_EXPIRES_IN;
    delete process.env.WEB_APP_ORIGIN;
  });

  const authHeader = () => `Bearer ${createAccessToken(BigInt(1))}`;

  const organization = {
    id: BigInt(1),
    userId: BigInt(1),
    name: "프래그먼트 카페",
    businessHours: [],
  };

  it("requires authentication when listing workers", async () => {
    const { prisma } = createFakePrisma({ organizations: [organization] });
    const app = createApp({ prisma });

    const response = await request(app).get("/api/workers");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      errorCode: "UNAUTHORIZED",
      statusCode: 401,
    });
  });

  it("requires an organization", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });

    const response = await request(app).get("/api/workers").set("Authorization", authHeader());

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      errorCode: "ORGANIZATION_REQUIRED",
      statusCode: 403,
    });
  });

  it("lists workers in the authenticated user's organization ordered by employee code", async () => {
    const { prisma } = createFakePrisma({
      organizations: [
        organization,
        {
          id: BigInt(2),
          userId: BigInt(2),
          name: "다른 조직",
          businessHours: [],
        },
      ],
      workers: [
        {
          id: BigInt(1),
          organizationId: BigInt(1),
          employeeCode: "W-0002",
          name: "박준호",
          weeklyContractHours: 24,
        },
        {
          id: BigInt(2),
          organizationId: BigInt(1),
          employeeCode: "W-0001",
          name: "김민지",
          weeklyContractHours: 20,
        },
        {
          id: BigInt(3),
          organizationId: BigInt(2),
          employeeCode: "W-0001",
          name: "이서연",
          weeklyContractHours: 16,
        },
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app).get("/api/workers").set("Authorization", authHeader());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [
        {
          id: "2",
          employeeCode: "W-0001",
          name: "김민지",
          weeklyContractHours: 20,
        },
        {
          id: "1",
          employeeCode: "W-0002",
          name: "박준호",
          weeklyContractHours: 24,
        },
      ],
    });
  });

  it("rejects invalid create input", async () => {
    const { prisma } = createFakePrisma({ organizations: [organization] });
    const app = createApp({ prisma });

    const response = await request(app)
      .post("/api/workers")
      .set("Authorization", authHeader())
      .send({
        name: "",
        weeklyContractHours: 0,
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      errorCode: "VALIDATION_ERROR",
      statusCode: 400,
    });
  });
});
