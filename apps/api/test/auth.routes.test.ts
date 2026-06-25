import { describe, expect, it, beforeEach } from "@jest/globals";
import { hash } from "bcryptjs";
import request from "supertest";

import { createApp } from "@/app";
import { createAccessToken } from "@/modules/auth/auth.tokens";
import { createFakePrisma } from "./helpers/fake-prisma";

describe("auth routes", () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    delete process.env.JWT_ACCESS_EXPIRES_IN;
    delete process.env.REFRESH_TOKEN_EXPIRES_DAYS;
    delete process.env.WEB_APP_ORIGIN;
  });

  it("signs up a user, returns an access token, and sets a refresh cookie", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });

    const response = await request(app).post("/api/auth/signup").send({
      name: "홍길동",
      email: "owner@example.com",
      password: "password123",
      passwordConfirm: "password123",
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      accessToken: expect.any(String),
      hasOrganization: false,
      user: {
        id: "1",
        email: "owner@example.com",
        name: "홍길동",
      },
    });
    expect(response.headers["set-cookie"]?.[0]).toContain("refreshToken=");
    expect(response.headers["set-cookie"]?.[0]).toContain("HttpOnly");
  });

  it("returns a validation error for invalid signup input", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });

    const response = await request(app).post("/api/auth/signup").send({
      name: "",
      email: "invalid-email",
      password: "short",
      passwordConfirm: "different",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      errorCode: "VALIDATION_ERROR",
      statusCode: 400,
    });
  });

  it("rejects duplicate signup emails", async () => {
    const { prisma } = createFakePrisma({
      users: [
        {
          id: BigInt(1),
          email: "owner@example.com",
          name: "기존 사용자",
          passwordHash: "stored-hash",
        },
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app).post("/api/auth/signup").send({
      name: "홍길동",
      email: "owner@example.com",
      password: "password123",
      passwordConfirm: "password123",
    });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      errorCode: "DUPLICATE_EMAIL",
      statusCode: 409,
    });
  });

  it("logs in and reports whether the user has an organization", async () => {
    const passwordHash = await hash("password123", 1);
    const { prisma } = createFakePrisma({
      organizations: [
        {
          id: BigInt(10),
          userId: BigInt(1),
          name: "프래그먼트 카페",
          businessHours: [],
        },
      ],
      users: [
        {
          id: BigInt(1),
          email: "owner@example.com",
          name: "홍길동",
          passwordHash,
        },
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app).post("/api/auth/login").send({
      email: "owner@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      accessToken: expect.any(String),
      hasOrganization: true,
      user: {
        id: "1",
        email: "owner@example.com",
        name: "홍길동",
      },
    });
  });

  it("rejects invalid login credentials", async () => {
    const passwordHash = await hash("password123", 1);
    const { prisma } = createFakePrisma({
      users: [
        {
          id: BigInt(1),
          email: "owner@example.com",
          name: "홍길동",
          passwordHash,
        },
      ],
    });
    const app = createApp({ prisma });

    const response = await request(app).post("/api/auth/login").send({
      email: "owner@example.com",
      password: "wrong-password",
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      errorCode: "UNAUTHORIZED",
      statusCode: 401,
    });
  });

  it("refreshes a session with the refresh cookie", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });
    const signupResponse = await request(app).post("/api/auth/signup").send({
      name: "홍길동",
      email: "owner@example.com",
      password: "password123",
      passwordConfirm: "password123",
    });

    const response = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", signupResponse.headers["set-cookie"]);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      accessToken: expect.any(String),
      hasOrganization: false,
      user: {
        id: "1",
        email: "owner@example.com",
      },
    });
    expect(response.headers["set-cookie"]?.[0]).toContain("refreshToken=");
  });

  it("rejects reusing a consumed refresh cookie", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });
    const signupResponse = await request(app).post("/api/auth/signup").send({
      name: "홍길동",
      email: "owner@example.com",
      password: "password123",
      passwordConfirm: "password123",
    });
    const initialRefreshCookie = signupResponse.headers["set-cookie"];

    const firstRefreshResponse = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", initialRefreshCookie);
    const secondRefreshResponse = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", initialRefreshCookie);

    expect(firstRefreshResponse.status).toBe(200);
    expect(secondRefreshResponse.status).toBe(401);
    expect(secondRefreshResponse.body).toMatchObject({
      errorCode: "UNAUTHORIZED",
      statusCode: 401,
    });
  });

  it("logs out with the refresh cookie and clears it", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });
    const signupResponse = await request(app).post("/api/auth/signup").send({
      name: "홍길동",
      email: "owner@example.com",
      password: "password123",
      passwordConfirm: "password123",
    });

    const response = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", signupResponse.headers["set-cookie"]);

    expect(response.status).toBe(204);
    expect(response.headers["set-cookie"]?.[0]).toContain("refreshToken=");
    expect(response.headers["set-cookie"]?.[0]).toContain("Expires=Thu, 01 Jan 1970");
  });

  it("returns the authenticated user and organization", async () => {
    const { prisma } = createFakePrisma({
      organizations: [
        {
          id: BigInt(10),
          userId: BigInt(1),
          name: "프래그먼트 카페",
          businessHours: [],
        },
      ],
      users: [
        {
          id: BigInt(1),
          email: "owner@example.com",
          name: "홍길동",
          passwordHash: "stored-hash",
        },
      ],
    });
    const app = createApp({ prisma });
    const accessToken = createAccessToken(BigInt(1));

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      organization: {
        id: "10",
        name: "프래그먼트 카페",
      },
      user: {
        id: "1",
        email: "owner@example.com",
        name: "홍길동",
      },
    });
  });

  it("requires a bearer token for the current user route", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });

    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      errorCode: "UNAUTHORIZED",
      statusCode: 401,
    });
  });
});
