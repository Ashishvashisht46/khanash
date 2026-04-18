import { NextFunction, Request, Response } from "express";

import { AppError } from "../core/errors/app-error";
import { verifyAccessToken } from "../modules/auth/auth.tokens";

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(new AppError("Authentication required.", 401, "AUTH_REQUIRED"));
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch (_error) {
    next(new AppError("Invalid or expired access token.", 401, "INVALID_ACCESS_TOKEN"));
  }
};
