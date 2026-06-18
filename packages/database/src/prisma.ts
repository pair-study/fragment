import { PrismaClient } from "@prisma/client";

export const createPrismaClient = () => new PrismaClient();

export const prisma = createPrismaClient();
