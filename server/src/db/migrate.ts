import fs from "fs";
import path from "path";

import { logger } from "../core/logger/logger";
import { pool } from "./pool";

const migrationsDir = path.join(__dirname, "migrations");

const run = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const existing = await pool.query<{ version: string }>(
      "SELECT version FROM schema_migrations WHERE version = $1",
      [file],
    );

    if (existing.rowCount) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");

    await pool.query("BEGIN");

    try {
      await pool.query(sql);
      await pool.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
      await pool.query("COMMIT");
      logger.info("Migration applied", { version: file });
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }
};

run()
  .then(async () => {
    logger.info("Database migrations complete");
    await pool.end();
  })
  .catch(async (error) => {
    logger.error("Database migration failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    await pool.end();
    process.exit(1);
  });
