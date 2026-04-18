import ms from "ms";

import { AppError } from "../../core/errors/app-error";
import { comparePassword, hashPassword, sha256 } from "../../utils/hash";
import { createTokenPair, verifyRefreshToken } from "./auth.tokens";
import { AuthRepository } from "./auth.repository";
import { AuthResponse, SafeUser, UserRecord } from "./auth.types";
import { env } from "../../config/env";

const toSafeUser = (user: UserRecord): SafeUser => ({
  id: user.id,
  email: user.email,
  isActive: user.is_active,
  createdAt: user.created_at.toISOString(),
  updatedAt: user.updated_at.toISOString(),
});

const getRefreshTokenExpiresAt = (): Date => {
  const ttl = ms(env.REFRESH_TOKEN_TTL);

  if (ttl === undefined) {
    throw new AppError("Invalid refresh token TTL configuration.", 500, "INVALID_TOKEN_TTL");
  }

  return new Date(Date.now() + ttl);
};

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  public async signup(input: { email: string; password: string }): Promise<AuthResponse> {
    const existing = await this.authRepository.findByEmail(input.email);

    if (existing) {
      throw new AppError("An account with this email already exists.", 409, "EMAIL_TAKEN");
    }

    const passwordHash = await hashPassword(input.password);
    const created = await this.authRepository.createUserWithPassword({
      email: input.email,
      passwordHash,
    });

    const rotatedTokens = createTokenPair({
      userId: created.user.id,
      email: created.user.email,
      identityId: created.identity.id,
    });
    const refreshTokenExpiresAt = getRefreshTokenExpiresAt();

    await this.authRepository.updateRefreshToken({
      identityId: created.identity.id,
      refreshTokenHash: sha256(rotatedTokens.refreshToken),
      refreshTokenExpiresAt,
    });

    return {
      user: toSafeUser(created.user),
      ...rotatedTokens,
    };
  }

  public async login(input: { email: string; password: string }): Promise<AuthResponse> {
    const account = await this.authRepository.findByEmail(input.email);

    if (!account?.identity.password_hash) {
      throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
    }

    if (!account.user.is_active) {
      throw new AppError("Your account is inactive.", 403, "ACCOUNT_INACTIVE");
    }

    const isMatch = await comparePassword(input.password, account.identity.password_hash);

    if (!isMatch) {
      throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
    }

    const tokens = createTokenPair({
      userId: account.user.id,
      email: account.user.email,
      identityId: account.identity.id,
    });

    await this.authRepository.updateRefreshToken({
      identityId: account.identity.id,
      refreshTokenHash: sha256(tokens.refreshToken),
      refreshTokenExpiresAt: getRefreshTokenExpiresAt(),
    });

    return {
      user: toSafeUser(account.user),
      ...tokens,
    };
  }

  public async refresh(refreshToken: string): Promise<AuthResponse> {
    const payload = verifyRefreshToken(refreshToken);
    const account = await this.authRepository.findByIdentityId(payload.identityId);

    if (!account?.identity.refresh_token_hash || !account.identity.refresh_token_expires_at) {
      throw new AppError("Refresh token is invalid.", 401, "INVALID_REFRESH_TOKEN");
    }

    if (account.identity.refresh_token_hash !== sha256(refreshToken)) {
      throw new AppError("Refresh token is invalid.", 401, "INVALID_REFRESH_TOKEN");
    }

    if (account.identity.refresh_token_expires_at.getTime() < Date.now()) {
      throw new AppError("Refresh token has expired.", 401, "EXPIRED_REFRESH_TOKEN");
    }

    const tokens = createTokenPair({
      userId: account.user.id,
      email: account.user.email,
      identityId: account.identity.id,
    });

    await this.authRepository.updateRefreshToken({
      identityId: account.identity.id,
      refreshTokenHash: sha256(tokens.refreshToken),
      refreshTokenExpiresAt: getRefreshTokenExpiresAt(),
    });

    return {
      user: toSafeUser(account.user),
      ...tokens,
    };
  }

}
