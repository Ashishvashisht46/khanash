import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { env } from "../../config/env";
import { logger } from "../logger/logger";
import { AppError } from "./app-error";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed.",
      code: "VALIDATION_ERROR",
      errors: error.flatten(),
    });
    return;
  }

  const appError = error instanceof AppError ? error : new AppError("Internal server error.");

  logger.error("Request failed", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode: appError.statusCode,
    code: appError.code,
    error: error.message,
    stack: env.NODE_ENV === "production" ? undefined : error.stack,
  });

  res.status(appError.statusCode).json({
    message: appError.message,
    code: appError.code,
    details: appError.details,
    requestId: req.requestId,
  });
};
