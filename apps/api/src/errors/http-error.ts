import type { ErrorCode } from "../common/constants/error-codes";

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}
