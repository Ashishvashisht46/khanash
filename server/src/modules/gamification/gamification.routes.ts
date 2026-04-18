import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { requireOnboarding } from "../../middleware/require-onboarding";
import { asyncHandler } from "../../utils/async-handler";
import { GamificationController } from "./gamification.controller";
import { GamificationRepository } from "./gamification.repository";
import { GamificationService } from "./gamification.service";

const gamificationRepository = new GamificationRepository();
const gamificationService = new GamificationService(gamificationRepository);
const gamificationController = new GamificationController(gamificationService);

export const gamificationRouter = Router();

gamificationRouter.use(authenticate, asyncHandler(requireOnboarding));

gamificationRouter.get("/summary", asyncHandler(gamificationController.summary));
gamificationRouter.get("/badges", asyncHandler(gamificationController.badges));
