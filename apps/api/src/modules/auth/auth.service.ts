import { Prisma, type PrismaClient } from "@fragment/database";
import { compare, hash } from "bcryptjs";

import { ERROR_CODES } from "../../common/constants/error-codes";
import { HttpError } from "../../errors/http-error";
import {
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiresAt,
  hashRefreshToken,
} from "./auth.tokens";

type SignupInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type AuthUser = {
  id: bigint;
  email: string;
  name: string;
};

type AuthDatabaseClient = PrismaClient | Prisma.TransactionClient;

const createInvalidRefreshTokenError = () =>
  new HttpError(401, ERROR_CODES.UNAUTHORIZED, "Refresh token이 유효하지 않습니다.");

async function issueAuthSession(client: AuthDatabaseClient, user: AuthUser) {
  const accessToken = createAccessToken(user.id);
  const refreshToken = createRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const refreshTokenExpiresAt = getRefreshTokenExpiresAt();
  const organization = await client.organization.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  await client.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: refreshTokenExpiresAt,
    },
  });

  return {
    response: {
      accessToken,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
      },
      hasOrganization: Boolean(organization),
    },
    refreshToken,
    refreshTokenExpiresAt,
  };
}

async function revokeActiveRefreshTokens(
  client: AuthDatabaseClient,
  userId: bigint,
  revokedAt: Date,
) {
  await client.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt,
    },
  });
}

async function createAuthSession(prisma: PrismaClient, user: AuthUser) {
  return prisma.$transaction(async (transaction) => {
    await revokeActiveRefreshTokens(transaction, user.id, new Date());
    return issueAuthSession(transaction, user);
  });
}

async function consumeRefreshToken(client: AuthDatabaseClient, tokenId: bigint, consumedAt: Date) {
  const { count } = await client.refreshToken.updateMany({
    where: {
      id: tokenId,
      revokedAt: null,
      expiresAt: {
        gt: consumedAt,
      },
    },
    data: {
      revokedAt: consumedAt,
    },
  });

  if (count !== 1) {
    throw createInvalidRefreshTokenError();
  }
}

export async function signup(prisma: PrismaClient, input: SignupInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new HttpError(409, ERROR_CODES.DUPLICATE_EMAIL, "이미 사용 중인 이메일입니다.");
  }

  const passwordHash = await hash(input.password, 12);

  let user: AuthUser;

  try {
    user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, ERROR_CODES.DUPLICATE_EMAIL, "이미 사용 중인 이메일입니다.");
    }

    throw error;
  }

  return createAuthSession(prisma, user);
}

export async function login(prisma: PrismaClient, input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new HttpError(401, ERROR_CODES.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  const isPasswordValid = await compare(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new HttpError(401, ERROR_CODES.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  return createAuthSession(prisma, user);
}

export async function logout(prisma: PrismaClient, refreshToken?: string) {
  if (!refreshToken) {
    throw createInvalidRefreshTokenError();
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt <= new Date()) {
    throw createInvalidRefreshTokenError();
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });
}

export async function refreshSession(prisma: PrismaClient, refreshToken?: string) {
  if (!refreshToken) {
    throw createInvalidRefreshTokenError();
  }

  const tokenHash = hashRefreshToken(refreshToken);

  return prisma.$transaction(async (transaction) => {
    const now = new Date();
    const storedToken = await transaction.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!storedToken) {
      throw createInvalidRefreshTokenError();
    }

    await consumeRefreshToken(transaction, storedToken.id, now);
    return issueAuthSession(transaction, storedToken.user);
  });
}

export async function getMe(prisma: PrismaClient, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!user) {
    throw new HttpError(401, ERROR_CODES.UNAUTHORIZED, "인증이 필요합니다.");
  }

  return {
    user: {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
    },
    organization: user.organization
      ? {
          id: user.organization.id.toString(),
          name: user.organization.name,
        }
      : null,
  };
}
