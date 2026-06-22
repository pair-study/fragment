import cors from "cors";
import express from "express";
import type { PrismaClient } from "@fragment/database";

type AppDependencies = {
  prisma: PrismaClient;
};

export const createApp = ({ prisma }: AppDependencies) => {
  const app = express();

  app.locals.prisma = prisma;

  app.use(cors());
  app.use(express.json());

  return app;
};
