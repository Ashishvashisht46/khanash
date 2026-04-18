import { query, withTransaction } from "../../db/pool";
import {
  AiCacheRecord,
  AiJobRecord,
  AiRequestRecord,
  AiWorkoutPlanResult,
  PromptVersionRecord,
} from "./ai.types";

export class AiRepository {
  public async findCache(userId: string, hash: string): Promise<AiCacheRecord | null> {
    const result = await query<AiCacheRecord>(
      `
        SELECT id, user_id, hash, result, created_at
        FROM ai_cache
        WHERE user_id = $1 AND hash = $2
        LIMIT 1
      `,
      [userId, hash],
    );

    return result.rows[0] ?? null;
  }

  public async createWorkoutPlanRequest(userId: string): Promise<{ request: AiRequestRecord; job: AiJobRecord }> {
    return withTransaction(async (client) => {
      const requestResult = await client.query<AiRequestRecord>(
        `
          INSERT INTO ai_requests (user_id, type, status)
          VALUES ($1, 'workout_plan', 'queued')
          RETURNING id, user_id, type, status, created_at
        `,
        [userId],
      );

      const request = requestResult.rows[0];

      const jobResult = await client.query<AiJobRecord>(
        `
          INSERT INTO ai_jobs (request_id, status, result)
          VALUES ($1, 'queued', NULL)
          RETURNING id, request_id, status, result, created_at
        `,
        [request.id],
      );

      return { request, job: jobResult.rows[0] };
    });
  }

  public async markJobProcessing(jobId: string): Promise<void> {
    await withTransaction(async (client) => {
      await client.query(`UPDATE ai_jobs SET status = 'processing' WHERE id = $1`, [jobId]);
      await client.query(
        `
          UPDATE ai_requests
          SET status = 'processing'
          WHERE id = (SELECT request_id FROM ai_jobs WHERE id = $1)
        `,
        [jobId],
      );
    });
  }

  public async completeJob(jobId: string, userId: string, hash: string, result: AiWorkoutPlanResult): Promise<void> {
    await withTransaction(async (client) => {
      await client.query(
        `
          UPDATE ai_jobs
          SET status = 'completed', result = $2::jsonb
          WHERE id = $1
        `,
        [jobId, JSON.stringify(result)],
      );

      await client.query(
        `
          UPDATE ai_requests
          SET status = 'completed'
          WHERE id = (SELECT request_id FROM ai_jobs WHERE id = $1)
        `,
        [jobId],
      );

      await client.query(
        `
          INSERT INTO ai_cache (user_id, hash, result)
          VALUES ($1, $2, $3::jsonb)
          ON CONFLICT (user_id, hash)
          DO UPDATE SET result = EXCLUDED.result, created_at = NOW()
        `,
        [userId, hash, JSON.stringify(result)],
      );
    });
  }

  public async failJob(jobId: string, errorMessage: string): Promise<void> {
    const errorResult = JSON.stringify({ error: errorMessage });

    await withTransaction(async (client) => {
      await client.query(
        `
          UPDATE ai_jobs
          SET status = 'failed', result = $2::jsonb
          WHERE id = $1
        `,
        [jobId, errorResult],
      );

      await client.query(
        `
          UPDATE ai_requests
          SET status = 'failed'
          WHERE id = (SELECT request_id FROM ai_jobs WHERE id = $1)
        `,
        [jobId],
      );
    });
  }

  public async getJobForUser(jobId: string, userId: string): Promise<AiJobRecord | null> {
    const result = await query<AiJobRecord>(
      `
        SELECT j.id, j.request_id, j.status, j.result, j.created_at
        FROM ai_jobs j
        INNER JOIN ai_requests r ON r.id = j.request_id
        WHERE j.id = $1 AND r.user_id = $2
        LIMIT 1
      `,
      [jobId, userId],
    );

    return result.rows[0] ?? null;
  }

  public async getJobForProcessing(jobId: string): Promise<(AiJobRecord & { user_id: string }) | null> {
    const result = await query<AiJobRecord & { user_id: string }>(
      `
        SELECT j.id, j.request_id, j.status, j.result, j.created_at, r.user_id
        FROM ai_jobs j
        INNER JOIN ai_requests r ON r.id = j.request_id
        WHERE j.id = $1
        LIMIT 1
      `,
      [jobId],
    );

    return result.rows[0] ?? null;
  }

  public async getLatestPromptVersion(): Promise<PromptVersionRecord> {
    const result = await query<PromptVersionRecord>(
      `
        SELECT id, version, template, created_at
        FROM prompt_versions
        ORDER BY created_at DESC
        LIMIT 1
      `,
    );

    return result.rows[0];
  }
}
