import type { NextFunction, Request, RequestHandler, Response } from "express";

import { ERROR_CODES } from "../common/constants/error-codes";
import { HttpError } from "../errors/http-error";

const getHeaderOrigin = (value: string | undefined): string | null => {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

export const createRequireSameOrigin = (allowedOrigin?: string): RequestHandler => {
  const normalizedAllowedOrigin = getHeaderOrigin(allowedOrigin);

  if (allowedOrigin && !normalizedAllowedOrigin) {
    throw new Error("WEB_APP_ORIGIN must be a valid URL origin");
  }

  return (req: Request, _res: Response, next: NextFunction) => {
    if (!normalizedAllowedOrigin) {
      next();
      return;
    }

    const requestOrigin =
      getHeaderOrigin(req.headers.origin) ?? getHeaderOrigin(req.headers.referer);
    const hasOriginHeader = Boolean(req.headers.origin || req.headers.referer);

    // TODO: Before production, reject requests that omit both Origin and Referer.
    // This temporary allowance keeps local Postman/curl auth testing usable.
    if (!hasOriginHeader || requestOrigin === normalizedAllowedOrigin) {
      next();
      return;
    }

    next(new HttpError(403, ERROR_CODES.FORBIDDEN, "허용되지 않은 요청 출처입니다."));
  };
};
