import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import swaggerUi from "swagger-ui-express";
import type { PrismaClient } from "@fragment/database";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import { errorHandler } from "@/middlewares/error-handler";
import { getOpenApiDocument } from "@/openapi";
import { apiRoutes } from "@/routes";

type AppDependencies = {
  prisma: PrismaClient;
};

export const createApp = ({ prisma }: AppDependencies) => {
  const app = express();
  const webAppOrigin = process.env.WEB_APP_ORIGIN;

  if (process.env.NODE_ENV === "production" && !webAppOrigin) {
    throw new Error("WEB_APP_ORIGIN is required in production");
  }

  app.locals.prisma = prisma;

  app.use(
    cors({
      origin: webAppOrigin ?? true,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  const openApiDocument = getOpenApiDocument();

  app.get("/api/openapi.json", (_req, res) => {
    res.json(openApiDocument);
  });
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: "프래그먼트 API Docs",
    }),
  );

  app.use("/api", apiRoutes);

  app.use((_req, _res, next) => {
    next(new HttpError(404, ERROR_CODES.NOT_FOUND, "요청한 API를 찾을 수 없습니다."));
  });

  app.use(errorHandler);

  return app;
};
