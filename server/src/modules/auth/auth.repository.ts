import { PoolClient } from "pg";

import { query, withTransaction } from "../../db/pool";
import { AuthIdentityRecord, UserRecord, UserWithIdentity } from "./auth.types";

const mapUserWithIdentity = (row: Record<string, unknown>): UserWithIdentity => ({
  user: {
    id: row.user_id as string,
    email: row.user_email as string,
    is_active: row.user_is_active as boolean,
    created_at: row.user_created_at as Date,
    updated_at: row.user_updated_at as Date,
  },
  identity: {
    id: row.identity_id as string,
    user_id: row.identity_user_id as string,
    provider: row.identity_provider as string,
    provider_subject: row.identity_provider_subject as string,
    password_hash: row.identity_password_hash as string | null,
    refresh_token_hash: row.identity_refresh_token_hash as string | null,
    refresh_token_expires_at: row.identity_refresh_token_expires_at as Date | null,
    last_login_at: row.identity_last_login_at as Date | null,
    created_at: row.identity_created_at as Date,
    updated_at: row.identity_updated_at as Date,
  },
});

const userIdentitySelect = `
  SELECT
    u.id AS user_id,
    u.email AS user_email,
    u.is_active AS user_is_active,
    u.created_at AS user_created_at,
    u.updated_at AS user_updated_at,
    ai.id AS identity_id,
    ai.user_id AS identity_user_id,
    ai.provider AS identity_provider,
    ai.provider_subject AS identity_provider_subject,
    ai.password_hash AS identity_password_hash,
    ai.refresh_token_hash AS identity_refresh_token_hash,
    ai.refresh_token_expires_at AS identity_refresh_token_expires_at,
    ai.last_login_at AS identity_last_login_at,
    ai.created_at AS identity_created_at,
    ai.updated_at AS identity_updated_at
  FROM users u
  INNER JOIN auth_identities ai ON ai.user_id = u.id
`;

export class AuthRepository {
  public async createUserWithPassword(input: {
    email: string;
    passwordHash: string;
  }): Promise<UserWithIdentity> {
    return withTransaction(async (client) => {
      const user = await this.insertUser(client, input.email);
      const identity = await this.insertEmailIdentity(client, {
        userId: user.id,
        email: input.email,
        passwordHash: input.passwordHash,
      });

      return { user, identity };
    });
  }

  public async findByEmail(email: string): Promise<UserWithIdentity | null> {
    const result = await query<Record<string, unknown>>(
      `
        ${userIdentitySelect}
        WHERE LOWER(u.email) = LOWER($1) AND ai.provider = 'email'
        LIMIT 1
      `,
      [email],
    );

    if (!result.rowCount) {
      return null;
    }

    return mapUserWithIdentity(result.rows[0]);
  }

  public async findByIdentityId(identityId: string): Promise<UserWithIdentity | null> {
    const result = await query<Record<string, unknown>>(
      `
        ${userIdentitySelect}
        WHERE ai.id = $1
        LIMIT 1
      `,
      [identityId],
    );

    if (!result.rowCount) {
      return null;
    }

    return mapUserWithIdentity(result.rows[0]);
  }

  public async findUserById(userId: string): Promise<UserRecord | null> {
    const result = await query<UserRecord>(
      `
        SELECT id, email, is_active, created_at, updated_at
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId],
    );

    return result.rows[0] ?? null;
  }

  public async updateRefreshToken(input: {
    identityId: string;
    refreshTokenHash: string;
    refreshTokenExpiresAt: Date;
  }): Promise<void> {
    await query(
      `
        UPDATE auth_identities
        SET
          refresh_token_hash = $2,
          refresh_token_expires_at = $3,
          last_login_at = NOW()
        WHERE id = $1
      `,
      [input.identityId, input.refreshTokenHash, input.refreshTokenExpiresAt],
    );
  }

  private async insertUser(client: PoolClient, email: string): Promise<UserRecord> {
    const result = await client.query<UserRecord>(
      `
        INSERT INTO users (email)
        VALUES ($1)
        RETURNING id, email, is_active, created_at, updated_at
      `,
      [email],
    );

    return result.rows[0];
  }

  private async insertEmailIdentity(
    client: PoolClient,
    input: {
      userId: string;
      email: string;
      passwordHash: string;
    },
  ): Promise<AuthIdentityRecord> {
    const result = await client.query<AuthIdentityRecord>(
      `
        INSERT INTO auth_identities (
          user_id,
          provider,
          provider_subject,
          password_hash,
          last_login_at
        )
        VALUES ($1, 'email', $2, $3, NOW())
        RETURNING
          id,
          user_id,
          provider,
          provider_subject,
          password_hash,
          refresh_token_hash,
          refresh_token_expires_at,
          last_login_at,
          created_at,
          updated_at
      `,
      [
        input.userId,
        input.email,
        input.passwordHash,
      ],
    );

    return result.rows[0];
  }
}
