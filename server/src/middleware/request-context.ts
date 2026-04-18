import { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";

import { logger } from "../core/logger/logger";

export const requestContext = (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = Date.now();
  req.requestId = req.headers["x-request-id"]?.toString() ?? randomUUID();
  res.setHeader("x-request-id", req.requestId);

  res.on("finish", () => {
    logger.info("HTTP request completed", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
};
