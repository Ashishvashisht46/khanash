import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./core/logger/logger";
import { pool } from "./db/pool";
import { NotificationsRepository } from "./modules/notifications/notifications.repository";
import { NotificationsService } from "./modules/notifications/notifications.service";
import { NotificationsWorker } from "./modules/notifications/notifications.worker";

const app = createApp();
const notificationsWorker = new NotificationsWorker(
  new NotificationsService(new NotificationsRepository()),
);

const server = app.listen(env.PORT, () => {
  logger.info("API server started", {
    port: env.PORT,
    environment: env.NODE_ENV,
  });

  notificationsWorker.start();
});

const shutdown = async (signal: string): Promise<void> => {
  logger.info("Shutdown signal received", { signal });
  notificationsWorker.stop();
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
