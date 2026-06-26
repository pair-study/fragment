import type { RequestHandler } from "express";
import type { z } from "zod";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";

type RequestSchema = z.ZodType<{
  body?: unknown;
  query?: unknown;
  params?: unknown;
}>;

export function validate(schema: RequestSchema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      next(new HttpError(400, ERROR_CODES.VALIDATION_ERROR, "요청 형식이 올바르지 않습니다."));
      return;
    }

    if ("body" in result.data) {
      req.body = result.data.body;
    }

    if ("query" in result.data) {
      for (const key of Object.keys(req.query)) {
        delete req.query[key];
      }

      Object.assign(req.query, result.data.query);
    }

    if ("params" in result.data) {
      req.params = result.data.params as typeof req.params;
    }

    next();
  };
}
