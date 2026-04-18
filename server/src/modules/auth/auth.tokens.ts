import jwt from "jsonwebtoken";

import { env } from "../../config/env";
import { JwtAccessPayload, JwtRefreshPayload, TokenPair } from "./auth.types";

type TokenContext = {
  userId: string;
  email: string;
  identityId: string;
};

export const createTokenPair = ({ userId, email, identityId }: TokenContext): TokenPair => {
  const accessToken = jwt.sign(
    {
      sub: userId,
      email,
      identityId,
      type: "access",
    } satisfies JwtAccessPayload,
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: env.ACCESS_TOKEN_TTL },
  );

  const refreshToken = jwt.sign(
    {
      sub: userId,
      identityId,
      type: "refresh",
    } satisfies JwtRefreshPayload,
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: env.REFRESH_TOKEN_TTL },
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JwtAccessPayload =>
  jwt.verify(token, env.ACCESS_TOKEN_SECRET) as JwtAccessPayload;

export const verifyRefreshToken = (token: string): JwtRefreshPayload =>
  jwt.verify(token, env.REFRESH_TOKEN_SECRET) as JwtRefreshPayload;
