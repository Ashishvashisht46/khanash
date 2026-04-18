import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { requireOnboarding } from "../../middleware/require-onboarding";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/async-handler";
import { UsersRepository } from "../users/users.repository";
import { WorkoutsRepository } from "../workouts/workouts.repository";
import { AiController } from "./ai.controller";
import { AiJobQueue } from "./ai.queue";
import { AiRepository } from "./ai.repository";
import { getAiJobSchema } from "./ai.schemas";
import { AiService } from "./ai.service";

const usersRepository = new UsersRepository();
const workoutsRepository = new WorkoutsRepository(usersRepository);
const aiRepository = new AiRepository();
const aiService = new AiService(aiRepository, usersRepository, workoutsRepository);
const aiQueue = new AiJobQueue(async (jobId) => {
  await aiService.processWorkoutPlanJob(jobId);
});
const aiController = new AiController(aiService, aiQueue);

export const aiRouter = Router();

aiRouter.use(authenticate, asyncHandler(requireOnboarding));

aiRouter.post("/workout-plan", asyncHandler(aiController.workoutPlan));
aiRouter.get("/jobs/:jobId", validate(getAiJobSchema), asyncHandler(aiController.getJob));
