import { beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";

import { createApp } from "@/app";
import { createAccessToken } from "@/modules/auth/auth.tokens";
import { createFakePrisma, createTimeDate } from "./helpers/fake-prisma";

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
  businessHours: [
    {
      id: BigInt(1),
      organizationId: id,
      dayOfWeek: "MON" as const,
      isClosed: false,
      openTime: createTimeDate("09:00"),
      closeTime: createTimeDate("18:00"),
      closesNextDay: false,
    },
  ],
});

const createSchedule = ({
  confirmedAt,
  id,
  organizationId = BigInt(1),
  status = "CONFIRMED",
}: {
  confirmedAt: Date | null;
  id: bigint;
  organizationId?: bigint;
  status?: "DRAFT" | "CONFIRMED";
}) => ({
  id,
  organizationId,
  status,
  inputHash: `hash-${id.toString()}`,
  startDate: dateOnly("2026-07-01"),
  endDate: dateOnly("2026-07-31"),
  generatedAt: timestamp,
  confirmedAt,
  createdAt: timestamp,
  updatedAt: timestamp,
});

describe("dashboard routes", () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    delete process.env.JWT_ACCESS_EXPIRES_IN;
    delete process.env.WEB_APP_ORIGIN;
  });

  const authHeader = () => `Bearer ${createAccessToken(BigInt(1))}`;

  it("requires authentication", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });

    const response = await request(app).get("/api/dashboard");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      errorCode: "UNAUTHORIZED",
      statusCode: 401,
    });
  });

  it("requires an organization", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });

    const response = await request(app).get("/api/dashboard").set("Authorization", authHeader());

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      errorCode: "ORGANIZATION_REQUIRED",
      statusCode: 403,
    });
  });

  it("returns organization detail and the latest confirmed schedule", async () => {
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
          confirmedAt: new Date("2026-06-20T00:00:00.000Z"),
        }),
        createSchedule({
          id: BigInt(2),
          confirmedAt: new Date("2026-06-21T00:00:00.000Z"),
        }),
        createSchedule({
          id: BigInt(3),
          confirmedAt: new Date("2026-06-21T00:00:00.000Z"),
        }),
        createSchedule({
          id: BigInt(4),
          confirmedAt: null,
          status: "DRAFT",
        }),
        createSchedule({
          id: BigInt(5),
          organizationId: BigInt(2),
          confirmedAt: new Date("2026-06-30T00:00:00.000Z"),
        }),
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app).get("/api/dashboard").set("Authorization", authHeader());

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      organization: {
        id: "1",
        name: "프래그먼트 카페",
        businessHours: [
          {
            dayOfWeek: "MON",
            isClosed: false,
            openTime: "09:00",
            closeTime: "18:00",
            closesNextDay: false,
          },
        ],
      },
      latestConfirmedSchedule: {
        id: "3",
        status: "CONFIRMED",
        confirmedAt: "2026-06-21T00:00:00.000Z",
      },
    });
  });

  it("returns null when there is no confirmed schedule", async () => {
    const { prisma } = createFakePrisma({
      organizations: [createOrganization()],
      schedules: [
        createSchedule({
          id: BigInt(1),
          confirmedAt: null,
          status: "DRAFT",
        }),
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app).get("/api/dashboard").set("Authorization", authHeader());

    expect(response.status).toBe(200);
    expect(response.body.latestConfirmedSchedule).toBeNull();
  });
});
