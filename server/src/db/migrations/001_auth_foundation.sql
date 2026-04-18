CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_format_chk CHECK (POSITION('@' IN email) > 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users (created_at DESC);

CREATE TABLE IF NOT EXISTS auth_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'email',
  provider_subject TEXT NOT NULL,
  password_hash TEXT,
  refresh_token_hash TEXT,
  refresh_token_expires_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT auth_identity_provider_subject_unique UNIQUE (provider, provider_subject),
  CONSTRAINT auth_identity_password_required_chk CHECK (
    provider <> 'email' OR password_hash IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS auth_identities_user_provider_unique_idx
  ON auth_identities (user_id, provider);
CREATE INDEX IF NOT EXISTS auth_identities_user_id_idx ON auth_identities (user_id);
CREATE INDEX IF NOT EXISTS auth_identities_refresh_expires_idx ON auth_identities (refresh_token_expires_at);

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS auth_identities_set_updated_at ON auth_identities;
CREATE TRIGGER auth_identities_set_updated_at
BEFORE UPDATE ON auth_identities
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
