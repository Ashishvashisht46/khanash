import { PoolClient } from "pg";

import { query, withTransaction } from "../../db/pool";
import { UsersRepository } from "../users/users.repository";
import {
  CreateWorkoutSessionInput,
  TodayWorkoutResponse,
  WorkoutEntryRecord,
  WorkoutExercise,
  WorkoutHistoryItem,
  WorkoutPlanDayRecord,
  WorkoutPlanRecord,
  WorkoutSessionRecord,
} from "./workouts.types";

type PlanAggregateRow = Record<string, unknown>;

const mapPlanDay = (row: PlanAggregateRow): WorkoutPlanDayRecord => ({
  id: row.day_id as string,
  plan_id: row.plan_id as string,
  day_number: row.day_number as number,
  exercises: row.exercises as WorkoutExercise[],
  created_at: row.day_created_at as Date,
  updated_at: row.day_updated_at as Date,
});

const mapPlan = (row: PlanAggregateRow): WorkoutPlanRecord => ({
  id: row.plan_id as string,
  user_id: row.user_id as string,
  start_date: row.start_date as string,
  end_date: row.end_date as string,
  created_at: row.plan_created_at as Date,
  updated_at: row.plan_updated_at as Date,
});

export class WorkoutsRepository {
  constructor(private readonly usersRepository: UsersRepository) {}

  public async findActivePlanForDate(userId: string, targetDate: string): Promise<{
    plan: WorkoutPlanRecord;
    days: WorkoutPlanDayRecord[];
  } | null> {
    const result = await query<PlanAggregateRow>(
      `
        WITH latest_plan AS (
          SELECT id, user_id, start_date, end_date, created_at, updated_at
          FROM workout_plans
          WHERE user_id = $1
            AND $2::date BETWEEN start_date AND end_date
          ORDER BY created_at DESC
          LIMIT 1
        )
        SELECT
          lp.id AS plan_id,
          lp.user_id,
          lp.start_date,
          lp.end_date,
          lp.created_at AS plan_created_at,
          lp.updated_at AS plan_updated_at,
          wpd.id AS day_id,
          wpd.day_number,
          wpd.exercises,
          wpd.created_at AS day_created_at,
          wpd.updated_at AS day_updated_at
        FROM latest_plan lp
        INNER JOIN workout_plan_days wpd ON wpd.plan_id = lp.id
        ORDER BY wpd.day_number ASC
      `,
      [userId, targetDate],
    );

    if (!result.rowCount) {
      return null;
    }

    return {
      plan: mapPlan(result.rows[0]),
      days: result.rows.map(mapPlanDay),
    };
  }

  public async createWeeklyPlan(
    userId: string,
    startDate: string,
    endDate: string,
    days: Array<{ dayNumber: number; exercises: WorkoutExercise[] }>,
  ): Promise<{
    plan: WorkoutPlanRecord;
    days: WorkoutPlanDayRecord[];
  }> {
    return withTransaction(async (client) => {
      const planResult = await client.query<WorkoutPlanRecord>(
        `
          INSERT INTO workout_plans (user_id, start_date, end_date)
          VALUES ($1, $2, $3)
          RETURNING id, user_id, start_date, end_date, created_at, updated_at
        `,
        [userId, startDate, endDate],
      );

      const plan = planResult.rows[0];
      const createdDays: WorkoutPlanDayRecord[] = [];

      for (const day of days) {
        const dayResult = await client.query<WorkoutPlanDayRecord>(
          `
            INSERT INTO workout_plan_days (plan_id, day_number, exercises)
            VALUES ($1, $2, $3::jsonb)
            RETURNING id, plan_id, day_number, exercises, created_at, updated_at
          `,
          [plan.id, day.dayNumber, JSON.stringify(day.exercises)],
        );

        createdDays.push(dayResult.rows[0]);
      }

      return { plan, days: createdDays };
    });
  }

  public async replaceWeeklyPlan(
    userId: string,
    startDate: string,
    endDate: string,
    days: Array<{ dayNumber: number; exercises: WorkoutExercise[] }>,
  ): Promise<{
    plan: WorkoutPlanRecord;
    days: WorkoutPlanDayRecord[];
  }> {
    return withTransaction(async (client) => {
      await client.query(
        `
          DELETE FROM workout_plans
          WHERE user_id = $1
            AND daterange(start_date, end_date, '[]') && daterange($2::date, $3::date, '[]')
        `,
        [userId, startDate, endDate],
      );

      const planResult = await client.query<WorkoutPlanRecord>(
        `
          INSERT INTO workout_plans (user_id, start_date, end_date)
          VALUES ($1, $2, $3)
          RETURNING id, user_id, start_date, end_date, created_at, updated_at
        `,
        [userId, startDate, endDate],
      );

      const plan = planResult.rows[0];
      const createdDays: WorkoutPlanDayRecord[] = [];

      for (const day of days) {
        const dayResult = await client.query<WorkoutPlanDayRecord>(
          `
            INSERT INTO workout_plan_days (plan_id, day_number, exercises)
            VALUES ($1, $2, $3::jsonb)
            RETURNING id, plan_id, day_number, exercises, created_at, updated_at
          `,
          [plan.id, day.dayNumber, JSON.stringify(day.exercises)],
        );

        createdDays.push(dayResult.rows[0]);
      }

      return { plan, days: createdDays };
    });
  }

  public async findSessionByUserAndDate(userId: string, targetDate: string): Promise<WorkoutSessionRecord | null> {
    const result = await query<WorkoutSessionRecord>(
      `
        SELECT id, user_id, date, status, plan_id, plan_day_id, created_at, updated_at
        FROM workout_sessions
        WHERE user_id = $1 AND date = $2
        LIMIT 1
      `,
      [userId, targetDate],
    );

    return result.rows[0] ?? null;
  }

  public async createOrReplaceSession(
    userId: string,
    input: CreateWorkoutSessionInput & { date: string; planId: string | null; planDayId: string | null },
  ): Promise<WorkoutSessionRecord> {
    return withTransaction(async (client) => {
      const existing = await client.query<{ id: string }>(
        `SELECT id FROM workout_sessions WHERE user_id = $1 AND date = $2 LIMIT 1`,
        [userId, input.date],
      );

      let sessionId: string;

      if (existing.rowCount) {
        sessionId = existing.rows[0].id;
        await client.query(`DELETE FROM workout_entries WHERE session_id = $1`, [sessionId]);
        await client.query(
          `
            UPDATE workout_sessions
            SET status = $2, plan_id = $3, plan_day_id = $4
            WHERE id = $1
          `,
          [sessionId, input.status, input.planId, input.planDayId],
        );
      } else {
        const created = await client.query<{ id: string }>(
          `
            INSERT INTO workout_sessions (user_id, date, status, plan_id, plan_day_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
          `,
          [userId, input.date, input.status, input.planId, input.planDayId],
        );
        sessionId = created.rows[0].id;
      }

      for (const entry of input.entries) {
        await client.query(
          `
            INSERT INTO workout_entries (session_id, exercise_name, sets, reps, weight)
            VALUES ($1, $2, $3, $4, $5)
          `,
          [sessionId, entry.exerciseName, entry.sets, entry.reps, entry.weight],
        );
      }

      const result = await client.query<WorkoutSessionRecord>(
        `
          SELECT id, user_id, date, status, plan_id, plan_day_id, created_at, updated_at
          FROM workout_sessions
          WHERE id = $1
          LIMIT 1
        `,
        [sessionId],
      );

      return result.rows[0];
    });
  }

  public async getHistory(userId: string, limit = 30): Promise<WorkoutHistoryItem[]> {
    const sessionResult = await query<WorkoutSessionRecord>(
      `
        SELECT id, user_id, date, status, plan_id, plan_day_id, created_at, updated_at
        FROM workout_sessions
        WHERE user_id = $1
        ORDER BY date DESC, created_at DESC
        LIMIT $2
      `,
      [userId, limit],
    );

    if (!sessionResult.rowCount) {
      return [];
    }

    const sessionIds = sessionResult.rows.map((session) => session.id);
    const entriesResult = await query<WorkoutEntryRecord>(
      `
        SELECT id, session_id, exercise_name, sets, reps, weight, created_at
        FROM workout_entries
        WHERE session_id = ANY($1::uuid[])
        ORDER BY created_at ASC
      `,
      [sessionIds],
    );

    const entryMap = new Map<string, WorkoutExercise[]>();

    for (const entry of entriesResult.rows) {
      const list = entryMap.get(entry.session_id) ?? [];
      list.push({
        exerciseName: entry.exercise_name,
        sets: entry.sets,
        reps: entry.reps,
        weight: Number(entry.weight),
      });
      entryMap.set(entry.session_id, list);
    }

    return sessionResult.rows.map((session) => ({
      sessionId: session.id,
      date: session.date,
      status: session.status,
      planId: session.plan_id,
      entries: entryMap.get(session.id) ?? [],
    }));
  }

  public async getProfileForPlanGeneration(userId: string) {
    return this.usersRepository.findProfileAggregateByUserId(userId);
  }
}
