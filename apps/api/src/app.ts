import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import type { PrismaClient } from "@fragment/database";

import { ERROR_CODES } from "./common/constants/error-codes";
import { HttpError } from "./errors/http-error";
import { errorHandler } from "./middlewares/error-handler";
import { authRoutes } from "./routes/auth.routes";

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

  app.use("/auth", authRoutes);

  app.use((_req, _res, next) => {
    next(new HttpError(404, ERROR_CODES.NOT_FOUND, "요청한 API를 찾을 수 없습니다."));
  });

  app.use(errorHandler);

  return app;
};
