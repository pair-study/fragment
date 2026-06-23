import type { PrismaClient } from "@fragment/database";
import type { RequestHandler } from "express";

import { clearRefreshTokenCookie, setRefreshTokenCookie } from "./auth.cookies";
import { getMe, login, logout, signup } from "./auth.service";

function getBearerToken(authorizationHeader: string | undefined) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return undefined;
  }

  return authorizationHeader.slice("Bearer ".length);
}

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

export const meHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const accessToken = getBearerToken(req.headers.authorization);
    const result = await getMe(prisma, accessToken);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
