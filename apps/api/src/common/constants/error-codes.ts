import { errorCodeSchema } from "@fragment/shared";

export const ERROR_CODES = errorCodeSchema.enum;
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
