import { beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";

import { createApp } from "@/app";
import { createFakePrisma } from "./helpers/fake-prisma";

const resolveOpenApiRef = (document: any, ref: string) =>
  ref
    .slice(2)
    .split("/")
    .reduce((value: any, key) => value?.[key], document);

const expectResponseExamplesToMatchStatusCodes = (document: any) => {
  for (const pathItem of Object.values<any>(document.paths)) {
    for (const operation of Object.values<any>(pathItem)) {
      const responses = operation.responses;

      if (!responses) {
        continue;
      }

      for (const [statusCode, responseDefinition] of Object.entries<any>(responses)) {
        const response =
          typeof responseDefinition.$ref === "string"
            ? resolveOpenApiRef(document, responseDefinition.$ref)
            : responseDefinition;

        if (typeof responseDefinition.$ref === "string") {
          expect(response).toBeDefined();
        }

        const jsonContent = response?.content?.["application/json"];
        const expectedStatusCode = Number(statusCode);

        if (!Number.isInteger(expectedStatusCode) || !jsonContent) {
          continue;
        }

        if (jsonContent.example?.statusCode !== undefined) {
          expect(jsonContent.example.statusCode).toBe(expectedStatusCode);
        }

        for (const example of Object.values<any>(jsonContent.examples ?? {})) {
          if (example.value?.statusCode !== undefined) {
            expect(example.value.statusCode).toBe(expectedStatusCode);
          }
        }
      }
    }
  }
};

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
    expect(response.body.paths["/dashboard"]).toBeDefined();
    expect(response.body.paths["/schedule-history"]).toBeDefined();
    expect(response.body.paths["/schedule-history/{scheduleId}"]).toBeDefined();
    expect(response.body.paths["/schedule-history/{scheduleId}/export.csv"]).toBeDefined();
    expect(response.body.paths["/staffing-rules"]).toBeDefined();
    expect(
      response.body.paths["/schedule-history/{scheduleId}/export.csv"].get.responses["200"].content[
        "text/csv; charset=utf-8"
      ],
    ).toBeDefined();
    expect(
      response.body.components.responses.MinimumStaffingRuleBadRequest.content["application/json"]
        .examples.closedDay.value.errorCode,
    ).toBe("CLOSED_DAY");
    expect(
      response.body.components.responses.MinimumStaffingRuleBadRequest.content["application/json"]
        .examples.invalidTimeRange.value.errorCode,
    ).toBe("INVALID_TIME_RANGE");
    expect(
      response.body.components.responses.DuplicateEmail.content["application/json"].example,
    ).toEqual({
      statusCode: 409,
      errorCode: "DUPLICATE_EMAIL",
      message: "이미 사용 중인 이메일입니다.",
    });
    expect(response.body.paths["/auth/signup"].post.responses["409"].$ref).toBe(
      "#/components/responses/DuplicateEmail",
    );
    expectResponseExamplesToMatchStatusCodes(response.body);
  });
});
