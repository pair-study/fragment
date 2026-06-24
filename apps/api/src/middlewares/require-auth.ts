import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import type { AuthenticatedUser } from "@/types/express";
import { toApiId, type DatabaseId } from "@/utils/mapper";

export type AccessTokenPayload = {
  userId: DatabaseId;
};

export type VerifyAccessToken = (token: string) => AccessTokenPayload | Promise<AccessTokenPayload>;

export type RequireAuthDependencies = {
  verifyAccessToken: VerifyAccessToken;
};

export const extractBearerToken = (authorizationHeader: string | undefined): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

const toAuthenticatedUser = (payload: AccessTokenPayload): AuthenticatedUser => ({
  id: toApiId(payload.userId),
});

export const createRequireAuth = ({
  verifyAccessToken,
}: RequireAuthDependencies): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      next(new HttpError(401, ERROR_CODES.UNAUTHORIZED, "인증이 필요합니다."));
      return;
    }

    try {
      const payload = await verifyAccessToken(token);
      req.user = toAuthenticatedUser(payload);
      next();
    } catch {
      next(new HttpError(401, ERROR_CODES.UNAUTHORIZED, "유효하지 않은 인증 토큰입니다."));
    }
  };
};
