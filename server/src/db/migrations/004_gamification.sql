CREATE TABLE IF NOT EXISTS xp_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  points INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT xp_ledger_points_positive_chk CHECK (points > 0)
);

CREATE INDEX IF NOT EXISTS xp_ledger_user_created_idx
  ON xp_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS xp_ledger_user_action_idx
  ON xp_ledger (user_id, action, created_at DESC);

CREATE TABLE IF NOT EXISTS streak_state (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT streak_state_current_streak_chk CHECK (current_streak >= 0)
);

CREATE TABLE IF NOT EXISTS badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  condition JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT badge_definitions_condition_object_chk CHECK (jsonb_typeof(condition) = 'object')
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_badges_user_badge_unique UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS user_badges_user_idx
  ON user_badges (user_id, unlocked_at DESC);

DROP TRIGGER IF EXISTS streak_state_set_updated_at ON streak_state;
CREATE TRIGGER streak_state_set_updated_at
BEFORE UPDATE ON streak_state
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

INSERT INTO badge_definitions (name, condition)
VALUES
  ('First Workout', '{"type":"workout_count","target":1}'),
  ('Three-Day Streak', '{"type":"streak","target":3}'),
  ('Seven-Day Streak', '{"type":"streak","target":7}'),
  ('Ten Workouts', '{"type":"workout_count","target":10}')
ON CONFLICT (name) DO NOTHING;
