import { NextFunction, Request, Response } from "express";

import { AppError } from "../core/errors/app-error";

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError("Route not found.", 404, "ROUTE_NOT_FOUND"));
};
