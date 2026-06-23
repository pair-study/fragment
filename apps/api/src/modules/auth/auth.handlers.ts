import type { PrismaClient } from "@fragment/database";
import type { RequestHandler } from "express";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import { clearRefreshTokenCookie, setRefreshTokenCookie } from "./auth.cookies";
import { getMe, login, logout, refreshSession, signup } from "./auth.service";

export const signupHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await signup(prisma, req.body);

    setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    res.status(201).json(result.response);
  } catch (error) {
    next(error);
  }
};

export const loginHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await login(prisma, req.body);

    setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    res.status(200).json(result.response);
  } catch (error) {
    next(error);
  }
};

export const logoutHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const refreshToken =
      typeof req.cookies?.refreshToken === "string" ? req.cookies.refreshToken : undefined;

    await logout(prisma, refreshToken);
    clearRefreshTokenCookie(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const refreshHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const refreshToken =
      typeof req.cookies?.refreshToken === "string" ? req.cookies.refreshToken : undefined;
    const result = await refreshSession(prisma, refreshToken);

    setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    res.status(200).json(result.response);
  } catch (error) {
    next(error);
  }
};

export const meHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;

    if (!req.user) {
      throw new HttpError(401, ERROR_CODES.UNAUTHORIZED, "인증이 필요합니다.");
    }

    const result = await getMe(prisma, req.user.id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
