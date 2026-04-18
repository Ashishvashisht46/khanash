import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { requireOnboarding } from "../../middleware/require-onboarding";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/async-handler";
import { GamificationRepository } from "../gamification/gamification.repository";
import { GamificationService } from "../gamification/gamification.service";
import { UsersRepository } from "../users/users.repository";
import { WorkoutsController } from "./workouts.controller";
import { WorkoutsRepository } from "./workouts.repository";
import { createWorkoutSessionSchema } from "./workouts.schemas";
import { WorkoutsService } from "./workouts.service";

const usersRepository = new UsersRepository();
const workoutsRepository = new WorkoutsRepository(usersRepository);
const gamificationRepository = new GamificationRepository();
const gamificationService = new GamificationService(gamificationRepository);
const workoutsService = new WorkoutsService(workoutsRepository, gamificationService);
const workoutsController = new WorkoutsController(workoutsService);

export const workoutsRouter = Router();

workoutsRouter.use(authenticate, asyncHandler(requireOnboarding));

workoutsRouter.get("/today", asyncHandler(workoutsController.today));
workoutsRouter.post("/sessions", validate(createWorkoutSessionSchema), asyncHandler(workoutsController.createSession));
workoutsRouter.get("/history", asyncHandler(workoutsController.history));
