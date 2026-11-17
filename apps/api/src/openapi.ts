import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

type OpenApiServer = {
  description?: string;
  url: string;
};

export type OpenApiDocument = {
  servers?: OpenApiServer[];
  [key: string]: unknown;
};

const OPENAPI_DOCUMENT_PATH = resolve(__dirname, "../../../docs/openapi.yaml");

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const getOpenApiDocument = (): OpenApiDocument => {
  const document = parse(readFileSync(OPENAPI_DOCUMENT_PATH, "utf8")) as OpenApiDocument;
  const publicBaseUrl = process.env.API_PUBLIC_BASE_URL?.trim();

  if (!publicBaseUrl) {
    return document;
  }

  const normalizedPublicBaseUrl = trimTrailingSlash(publicBaseUrl);
  const existingServers = document.servers ?? [];

  return {
    ...document,
    servers: [
      {
        url: normalizedPublicBaseUrl,
        description: "Configured deployment",
      },
      ...existingServers.filter((server) => server.url !== normalizedPublicBaseUrl),
    ],
  };
};
