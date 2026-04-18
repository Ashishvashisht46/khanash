import { NextFunction, Request, Response } from "express";

import { AppError } from "../core/errors/app-error";
import { UsersRepository } from "../modules/users/users.repository";

const usersRepository = new UsersRepository();

export const requireOnboarding = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  if (!req.auth?.sub) {
    next(new AppError("Authentication required.", 401, "AUTH_REQUIRED"));
    return;
  }

  const aggregate = await usersRepository.findProfileAggregateByUserId(req.auth.sub);

  if (!aggregate?.profile?.onboarding_completed_at || !aggregate.goal) {
    next(new AppError("Complete onboarding before accessing this resource.", 403, "ONBOARDING_REQUIRED"));
    return;
  }

  next();
};
