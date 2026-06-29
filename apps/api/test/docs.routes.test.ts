import { beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";

import { createApp } from "@/app";
import { createFakePrisma } from "./helpers/fake-prisma";

describe("docs routes", () => {
  beforeEach(() => {
    delete process.env.API_PUBLIC_BASE_URL;
    delete process.env.WEB_APP_ORIGIN;
  });

  it("serves Swagger UI", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });

    const response = await request(app).get("/api/docs/");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.text).toContain("swagger-ui");
  });

  it("does not persist Swagger UI authorization in browser storage", async () => {
    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });

    const response = await request(app).get("/api/docs/swagger-ui-init.js");

    expect(response.status).toBe(200);
    expect(response.text).not.toContain("persistAuthorization");
  });

  it("serves OpenAPI JSON with the configured public server first", async () => {
    process.env.API_PUBLIC_BASE_URL = "https://api.example.com/api";

    const { prisma } = createFakePrisma();
    const app = createApp({ prisma });

    const response = await request(app).get("/api/openapi.json");

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe("3.1.0");
    expect(response.body.servers[0]).toEqual({
      url: "https://api.example.com/api",
      description: "Configured deployment",
    });
    expect(response.body.paths["/staffing-rules"]).toBeDefined();
    expect(
      response.body.components.responses.MinimumStaffingRuleBadRequest.content["application/json"]
        .examples.closedDay.value.errorCode,
    ).toBe("CLOSED_DAY");
    expect(
      response.body.components.responses.MinimumStaffingRuleBadRequest.content["application/json"]
        .examples.invalidTimeRange.value.errorCode,
    ).toBe("INVALID_TIME_RANGE");
  });
});
