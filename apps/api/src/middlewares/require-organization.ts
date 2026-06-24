import type { PrismaClient } from "@fragment/database";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import { toApiId, toPrismaId } from "@/utils/mapper";

export type RequireOrganizationDependencies = {
  prisma: PrismaClient;
};

export const createRequireOrganization = ({
  prisma,
}: RequireOrganizationDependencies): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new HttpError(401, ERROR_CODES.UNAUTHORIZED, "인증이 필요합니다."));
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
          new HttpError(403, ERROR_CODES.ORGANIZATION_REQUIRED, "조직 생성 후 이용할 수 있습니다."),
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
