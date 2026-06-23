import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

const DEFAULT_ACCESS_TOKEN_EXPIRES_IN: SignOptions["expiresIn"] = "15m";
const DEFAULT_REFRESH_TOKEN_EXPIRES_DAYS = 14;

type AccessTokenPayload = {
  sub: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

export function createAccessToken(userId: bigint) {
  const payload: AccessTokenPayload = {
    sub: userId.toString(),
  };
  const expiresIn = (process.env.JWT_ACCESS_EXPIRES_IN ??
    DEFAULT_ACCESS_TOKEN_EXPIRES_IN) as SignOptions["expiresIn"];

  return jwt.sign(payload, getRequiredEnv("JWT_ACCESS_SECRET"), {
    expiresIn,
  });
}

export function verifyAccessToken(token: string) {
  const payload = jwt.verify(token, getRequiredEnv("JWT_ACCESS_SECRET"));

  if (typeof payload === "string" || typeof payload.sub !== "string") {
    throw new Error("Invalid access token payload");
  }

  return {
    userId: BigInt(payload.sub),
  };
}

export function createRefreshToken() {
  return randomBytes(64).toString("base64url");
}

export function hashRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getRefreshTokenExpiresAt() {
  const days = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? DEFAULT_REFRESH_TOKEN_EXPIRES_DAYS);
  const expiresAt = new Date();

  expiresAt.setDate(expiresAt.getDate() + days);

  return expiresAt;
}
