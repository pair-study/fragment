import { z } from "zod";
import { idSchema } from "./common";

export const workerSchema = z.object({
  id: idSchema,
  employeeCode: z.string(),
  name: z.string(),
  weeklyContractHours: z.number().int().min(1),
});

export const createWorkerRequestSchema = z.object({
  name: z.string().min(1),
  weeklyContractHours: z.number().int().min(1),
});

export const updateWorkerRequestSchema = createWorkerRequestSchema
  .partial()
  .refine((value) => value.name !== undefined || value.weeklyContractHours !== undefined, {
    message: "수정할 값을 하나 이상 입력해야 합니다.",
  });

export const workersListResponseSchema = z.object({
  items: z.array(workerSchema),
});
