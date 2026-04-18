CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  experience_level TEXT NOT NULL,
  available_equipment TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  workout_schedule JSONB NOT NULL DEFAULT '{}'::JSONB,
  diet_preference TEXT NOT NULL,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_experience_level_chk
    CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  CONSTRAINT profiles_diet_preference_chk
    CHECK (
      diet_preference IN (
        'balanced',
        'high_protein',
        'vegetarian',
        'vegan',
        'keto',
        'paleo',
        'other'
      )
    ),
  CONSTRAINT profiles_schedule_days_per_week_chk
    CHECK (
      jsonb_typeof(workout_schedule) = 'object'
      AND (workout_schedule ? 'daysPerWeek')
      AND ((workout_schedule ->> 'daysPerWeek')::INT BETWEEN 1 AND 7)
    )
);

CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles (user_id);
CREATE INDEX IF NOT EXISTS profiles_onboarding_completed_idx ON profiles (onboarding_completed_at);

CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  primary_goal TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_goals_primary_goal_chk
    CHECK (
      primary_goal IN (
        'lose_weight',
        'gain_muscle',
        'maintain_fitness',
        'improve_endurance',
        'increase_strength'
      )
    )
);

CREATE INDEX IF NOT EXISTS user_goals_user_id_idx ON user_goals (user_id);
CREATE INDEX IF NOT EXISTS user_goals_primary_goal_idx ON user_goals (primary_goal);

DROP TRIGGER IF EXISTS profiles_set_updated_at ON profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS user_goals_set_updated_at ON user_goals;
CREATE TRIGGER user_goals_set_updated_at
BEFORE UPDATE ON user_goals
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
