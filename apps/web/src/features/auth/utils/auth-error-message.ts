import { ApiError } from "@/lib/api-client";

const FALLBACK_AUTH_ERROR_MESSAGE = "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return FALLBACK_AUTH_ERROR_MESSAGE;
}
