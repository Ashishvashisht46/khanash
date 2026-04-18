import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/async-handler";
import { UsersController } from "./users.controller";
import { UsersRepository } from "./users.repository";
import { onboardingSchema, updateMeSchema } from "./users.schemas";
import { UsersService } from "./users.service";

const usersRepository = new UsersRepository();
const usersService = new UsersService(usersRepository);
const usersController = new UsersController(usersService);

export const usersRouter = Router();

usersRouter.post("/onboarding", authenticate, validate(onboardingSchema), asyncHandler(usersController.onboarding));
usersRouter.get("/me", authenticate, asyncHandler(usersController.me));
usersRouter.patch("/me", authenticate, validate(updateMeSchema), asyncHandler(usersController.updateMe));
