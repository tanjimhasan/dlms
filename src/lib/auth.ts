import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const SALT_ROUNDS = 12;

const getSecret = (type: "access" | "refresh") => {
  const secret =
    type === "access"
      ? process.env.JWT_SECRET
      : process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error(`Missing JWT ${type} secret`);
  return new TextEncoder().encode(secret);
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

interface TokenPayload {
  userId: string;
  role: string;
}

export async function generateAccessToken(
  payload: TokenPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuedAt()
    .sign(getSecret("access"));
}

export async function generateRefreshToken(
  payload: TokenPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setIssuedAt()
    .sign(getSecret("refresh"));
}

export async function verifyAccessToken(
  token: string
): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getSecret("access"));
  return payload as unknown as TokenPayload;
}

export async function verifyRefreshToken(
  token: string
): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getSecret("refresh"));
  return payload as unknown as TokenPayload;
}

export const COOKIE_OPTIONS = {
  access: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 15 * 60, // 15 minutes
  },
  refresh: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/auth/refresh",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
};
