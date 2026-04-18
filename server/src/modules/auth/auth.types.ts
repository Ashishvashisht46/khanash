export type SafeUser = {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = TokenPair & {
  user: SafeUser;
};

export type JwtAccessPayload = {
  sub: string;
  email: string;
  identityId: string;
  type: "access";
};

export type JwtRefreshPayload = {
  sub: string;
  identityId: string;
  type: "refresh";
};

export type UserRecord = {
  id: string;
  email: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type AuthIdentityRecord = {
  id: string;
  user_id: string;
  provider: string;
  provider_subject: string;
  password_hash: string | null;
  refresh_token_hash: string | null;
  refresh_token_expires_at: Date | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type UserWithIdentity = {
  user: UserRecord;
  identity: AuthIdentityRecord;
};
