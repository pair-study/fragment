import type { PrismaClient } from "@fragment/database";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ERROR_CODES, type ErrorCode } from "../errors/error-codes";
import { toApiId, toPrismaId } from "../utils/mapper";

export type RequireOrganizationDependencies = {
  prisma: PrismaClient;
};

type MiddlewareError = Error & {
  statusCode: number;
  errorCode: ErrorCode;
};

const createMiddlewareError = (
  statusCode: number,
  errorCode: ErrorCode,
  message: string,
): MiddlewareError =>
  Object.assign(new Error(message), {
    statusCode,
    errorCode,
  });

export const createRequireOrganization = ({
  prisma,
}: RequireOrganizationDependencies): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(createMiddlewareError(401, ERROR_CODES.UNAUTHORIZED, "인증이 필요합니다."));
      return;
    }

    try {
      const organization = await prisma.organization.findUnique({
        where: {
          userId: toPrismaId(req.user.id),
        },
        select: {
          id: true,
        },
      });

      if (!organization) {
        next(
          createMiddlewareError(
            403,
            ERROR_CODES.ORGANIZATION_REQUIRED,
            "조직 생성 후 이용할 수 있습니다.",
          ),
        );
        return;
      }

      req.organization = {
        id: toApiId(organization.id),
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
