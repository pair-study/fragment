import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import type { PrismaClient } from "@fragment/database";

import { HttpError } from "./errors/http-error";
import { errorHandler } from "./middlewares/error-handler";
import { authRoutes } from "./routes/auth.routes";

type AppDependencies = {
  prisma: PrismaClient;
};

export const createApp = ({ prisma }: AppDependencies) => {
  const app = express();

  app.locals.prisma = prisma;

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  app.use("/auth", authRoutes);

  app.use((_req, _res, next) => {
    next(new HttpError(404, "NOT_FOUND", "요청한 API를 찾을 수 없습니다."));
  });

  app.use(errorHandler);

  return app;
};
