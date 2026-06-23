import { errorResponseSchema, type ErrorResponse } from "@fragment/shared";

const DEFAULT_API_BASE_URL = "/api";

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

type ApiJsonRequestOptions = ApiRequestOptions & {
  responseType?: "json";
};

type ApiVoidRequestOptions = ApiRequestOptions & {
  responseType: "void";
};

type ApiErrorResponse = Partial<ErrorResponse>;

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

async function parseErrorResponse(response: Response) {
  const parsedResponse = await parseJsonResponse(response);
  const result = errorResponseSchema.safeParse(parsedResponse);

  return result.success ? result.data : undefined;
}

export function apiClient(path: string, options: ApiVoidRequestOptions): Promise<void>;
export function apiClient<TResponse>(
  path: string,
  options?: ApiJsonRequestOptions,
): Promise<TResponse>;
export async function apiClient<TResponse>(
  path: string,
  {
    body,
    headers,
    responseType = "json",
    ...init
  }: ApiJsonRequestOptions | ApiVoidRequestOptions = {},
): Promise<TResponse | void> {
  const requestHeaders = new Headers(headers);
  const hasBody = body !== undefined;

  if (hasBody && isJsonBody(body) && !requestHeaders.has("content-type")) {
    requestHeaders.set("content-type", "application/json");
  }

  if (!requestHeaders.has("accept")) {
    requestHeaders.set("accept", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(createApiUrl(path), {
      ...init,
      body: hasBody && isJsonBody(body) ? JSON.stringify(body) : (body as BodyInit | undefined),
      credentials: init.credentials ?? "include",
      headers: requestHeaders,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(0, {
      message: "네트워크 연결 상태를 확인한 뒤 다시 시도해 주세요.",
    });
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

  return (await parseJsonResponse(response)) as TResponse;
}
