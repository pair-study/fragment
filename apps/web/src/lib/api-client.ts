import { errorResponseSchema, type ErrorResponse } from "@fragment/shared";

const DEFAULT_API_BASE_URL = "/api";

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  auth?: boolean;
  body?: unknown;
  redirectOnUnauthorized?: boolean;
};

type ApiJsonRequestOptions = ApiRequestOptions & {
  responseType?: "json";
};

type ApiVoidRequestOptions = ApiRequestOptions & {
  responseType: "void";
};

type ApiErrorResponse = Partial<ErrorResponse>;

type ApiClientAuthHandlers = {
  getAccessToken: () => string | null;
  onUnauthorized: () => void;
  refreshAccessToken: () => Promise<string>;
};

let authHandlers: ApiClientAuthHandlers | null = null;

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

export function configureApiClientAuth(handlers: ApiClientAuthHandlers) {
  authHandlers = handlers;
}

export function resetApiClientAuth() {
  authHandlers = null;
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

function createInvalidJsonResponseError(response: Response) {
  return new ApiError(response.status, {
    message: "응답 형식이 올바르지 않습니다.",
  });
}

async function parseErrorResponse(response: Response) {
  try {
    const parsedResponse = await parseJsonResponse(response);
    const result = errorResponseSchema.safeParse(parsedResponse);

    return result.success ? result.data : undefined;
  } catch {
    return undefined;
  }
}

export function apiClient(path: string, options: ApiVoidRequestOptions): Promise<void>;
export function apiClient<TResponse>(
  path: string,
  options?: ApiJsonRequestOptions,
): Promise<TResponse>;
export async function apiClient<TResponse>(
  path: string,
  {
    auth = true,
    body,
    headers,
    redirectOnUnauthorized = true,
    responseType = "json",
    ...init
  }: ApiJsonRequestOptions | ApiVoidRequestOptions = {},
): Promise<TResponse | void> {
  const hasBody = body !== undefined;

  async function sendRequest() {
    const requestHeaders = new Headers(headers);

    if (hasBody && isJsonBody(body) && !requestHeaders.has("content-type")) {
      requestHeaders.set("content-type", "application/json");
    }

    if (!requestHeaders.has("accept")) {
      requestHeaders.set("accept", "application/json");
    }

    const accessToken = authHandlers?.getAccessToken();

    if (auth && accessToken && !requestHeaders.has("authorization")) {
      requestHeaders.set("authorization", `Bearer ${accessToken}`);
    }

    return fetch(createApiUrl(path), {
      ...init,
      body: hasBody && isJsonBody(body) ? JSON.stringify(body) : (body as BodyInit | undefined),
      credentials: init.credentials ?? "include",
      headers: requestHeaders,
    });
  }

  async function executeRequest() {
    try {
      return await sendRequest();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }

      throw new ApiError(0, {
        message: "네트워크 연결 상태를 확인한 뒤 다시 시도해 주세요.",
      });
    }
  }

  let response = await executeRequest();

  if (auth && response.status === 401 && authHandlers) {
    try {
      await authHandlers.refreshAccessToken();
      response = await executeRequest();
    } catch (error) {
      if (redirectOnUnauthorized) {
        authHandlers.onUnauthorized();
      }
      throw error;
    }
  }

  if (auth && redirectOnUnauthorized && response.status === 401) {
    authHandlers?.onUnauthorized();
  }

  if (!response.ok) {
    const errorResponse = await parseErrorResponse(response);

    throw new ApiError(response.status, errorResponse);
  }

  if (responseType === "void") {
    return;
  }

  if (response.status === 204) {
    throw new ApiError(response.status, {
      message: "응답 본문이 비어 있습니다.",
    });
  }

  let parsedResponse: unknown;

  try {
    parsedResponse = await parseJsonResponse(response);
  } catch {
    throw createInvalidJsonResponseError(response);
  }

  if (parsedResponse === undefined) {
    throw createInvalidJsonResponseError(response);
  }

  return parsedResponse as TResponse;
}
