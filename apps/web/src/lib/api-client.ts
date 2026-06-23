import type { ErrorResponse } from "@fragment/shared";

const DEFAULT_API_BASE_URL = "/api";

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

type ApiErrorResponse = Partial<ErrorResponse> & {
  message?: string;
};

export class ApiError extends Error {
  readonly statusCode: number;
  readonly errorCode?: ErrorResponse["errorCode"];
  readonly response?: ApiErrorResponse;

  constructor(statusCode: number, response?: ApiErrorResponse) {
    super(response?.message ?? "요청 처리 중 오류가 발생했습니다.");
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorCode = response?.errorCode;
    this.response = response;
  }
}

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

function createApiUrl(path: string) {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}

function isJsonBody(body: unknown) {
  return (
    body !== undefined &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof URLSearchParams) &&
    typeof body !== "string"
  );
}

async function parseJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return undefined;
  }

  return response.json();
}

export async function apiClient<TResponse>(
  path: string,
  { body, headers, ...init }: ApiRequestOptions = {},
): Promise<TResponse> {
  const requestHeaders = new Headers(headers);
  const hasBody = body !== undefined;

  if (hasBody && isJsonBody(body) && !requestHeaders.has("content-type")) {
    requestHeaders.set("content-type", "application/json");
  }

  if (!requestHeaders.has("accept")) {
    requestHeaders.set("accept", "application/json");
  }

  const response = await fetch(createApiUrl(path), {
    ...init,
    body: hasBody && isJsonBody(body) ? JSON.stringify(body) : (body as BodyInit | undefined),
    credentials: init.credentials ?? "include",
    headers: requestHeaders,
  });

  if (!response.ok) {
    const errorResponse = (await parseJsonResponse(response)) as ApiErrorResponse | undefined;

    throw new ApiError(response.status, errorResponse);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await parseJsonResponse(response)) as TResponse;
}
