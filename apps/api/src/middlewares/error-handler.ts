import type { ErrorRequestHandler } from "express";

import { isHttpError } from "../errors/http-error";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  void _next;

  if (isHttpError(error)) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });

    return;
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "서버 오류가 발생했습니다.",
    },
  });
};
