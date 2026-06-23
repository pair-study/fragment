import type { ErrorCode } from "./constants/error-codes";

export type MiddlewareError = Error & {
  statusCode: number;
  errorCode: ErrorCode;
};

export const createMiddlewareError = (
  statusCode: number,
  errorCode: ErrorCode,
  message: string,
): MiddlewareError =>
  Object.assign(new Error(message), {
    statusCode,
    errorCode,
  });
