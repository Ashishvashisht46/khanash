CREATE TABLE IF NOT EXISTS ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_requests_type_chk CHECK (type IN ('workout_plan')),
  CONSTRAINT ai_requests_status_chk CHECK (status IN ('queued', 'processing', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS ai_requests_user_created_idx
  ON ai_requests (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES ai_requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_jobs_status_chk CHECK (status IN ('queued', 'processing', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS ai_jobs_request_idx
  ON ai_jobs (request_id);

CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hash TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_cache_user_hash_unique UNIQUE (user_id, hash)
);

CREATE INDEX IF NOT EXISTS ai_cache_user_created_idx
  ON ai_cache (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  template TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO prompt_versions (version, template)
VALUES (
  'workout-plan-v1',
  'Generate a safe 7-day workout plan for:
Goal: {{goal}}
Experience: {{experience}}
Equipment: {{equipment}}
Schedule days per week: {{days_per_week}}
Preferred days: {{preferred_days}}

Return ONLY JSON in this exact format:
{
  "plan": [
    {
      "day": 1,
      "exercises": [
        {
          "name": "Push-ups",
          "sets": 3,
          "reps": 12
        }
      ]
    }
  ]
}

Rules:
- Always return 7 days.
- Use beginner-safe exercise selection when experience is beginner.
- Avoid extreme volume.
- Use empty exercise arrays for rest days.
- Keep exercises practical for listed equipment.'
)
ON CONFLICT (version) DO NOTHING;
