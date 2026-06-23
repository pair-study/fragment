import type { Response } from "express";

const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

const refreshTokenCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

export function setRefreshTokenCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
    ...refreshTokenCookieOptions,
    expires: expiresAt,
  });
}

export function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, refreshTokenCookieOptions);
}
