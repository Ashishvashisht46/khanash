CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT workout_plans_date_range_chk CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS workout_plans_user_date_idx
  ON workout_plans (user_id, start_date DESC, end_date DESC);

CREATE TABLE IF NOT EXISTS workout_plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT workout_plan_days_day_number_chk CHECK (day_number BETWEEN 1 AND 7),
  CONSTRAINT workout_plan_days_exercises_type_chk CHECK (jsonb_typeof(exercises) = 'array'),
  CONSTRAINT workout_plan_days_unique UNIQUE (plan_id, day_number)
);

CREATE INDEX IF NOT EXISTS workout_plan_days_plan_id_idx
  ON workout_plan_days (plan_id, day_number);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
  plan_day_id UUID REFERENCES workout_plan_days(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT workout_sessions_status_chk CHECK (status IN ('completed', 'skipped')),
  CONSTRAINT workout_sessions_user_date_unique UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS workout_sessions_user_date_idx
  ON workout_sessions (user_id, date DESC);

CREATE TABLE IF NOT EXISTS workout_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets INT NOT NULL,
  reps INT NOT NULL,
  weight NUMERIC(8, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT workout_entries_sets_chk CHECK (sets > 0),
  CONSTRAINT workout_entries_reps_chk CHECK (reps > 0),
  CONSTRAINT workout_entries_weight_chk CHECK (weight >= 0)
);

CREATE INDEX IF NOT EXISTS workout_entries_session_id_idx
  ON workout_entries (session_id);

DROP TRIGGER IF EXISTS workout_plans_set_updated_at ON workout_plans;
CREATE TRIGGER workout_plans_set_updated_at
BEFORE UPDATE ON workout_plans
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS workout_plan_days_set_updated_at ON workout_plan_days;
CREATE TRIGGER workout_plan_days_set_updated_at
BEFORE UPDATE ON workout_plan_days
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS workout_sessions_set_updated_at ON workout_sessions;
CREATE TRIGGER workout_sessions_set_updated_at
BEFORE UPDATE ON workout_sessions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
