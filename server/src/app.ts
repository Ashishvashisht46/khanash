import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { errorHandler } from "./core/errors/error-handler";
import { aiRouter } from "./modules/ai/ai.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { gamificationRouter } from "./modules/gamification/gamification.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";
import { usersRouter } from "./modules/users/users.routes";
import { workoutsRouter } from "./modules/workouts/workouts.routes";
import { notFoundHandler } from "./middleware/not-found";
import { requestContext } from "./middleware/request-context";

export const createApp = (): express.Express => {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: false,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(requestContext);

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/auth", authRouter);
  app.use("/ai", aiRouter);
  app.use("/gamification", gamificationRouter);
  app.use("/notifications", notificationsRouter);
  app.use("/", usersRouter);
  app.use("/workouts", workoutsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
