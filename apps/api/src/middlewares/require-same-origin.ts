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
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!allowedOrigin) {
      next();
      return;
    }

    const requestOrigin =
      getHeaderOrigin(req.headers.origin) ?? getHeaderOrigin(req.headers.referer);

    if (!requestOrigin || requestOrigin === allowedOrigin) {
      next();
      return;
    }

    next(new HttpError(403, ERROR_CODES.FORBIDDEN, "허용되지 않은 요청 출처입니다."));
  };
};
