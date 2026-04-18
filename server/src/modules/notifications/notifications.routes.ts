import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { requireOnboarding } from "../../middleware/require-onboarding";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/async-handler";
import { NotificationsController } from "./notifications.controller";
import { NotificationsRepository } from "./notifications.repository";
import { updateNotificationPreferencesSchema } from "./notifications.schemas";
import { NotificationsService } from "./notifications.service";

const notificationsRepository = new NotificationsRepository();
const notificationsService = new NotificationsService(notificationsRepository);
const notificationsController = new NotificationsController(notificationsService);

export const notificationsRouter = Router();

notificationsRouter.use(authenticate, asyncHandler(requireOnboarding));

notificationsRouter.get("/", asyncHandler(notificationsController.list));
notificationsRouter.patch(
  "/preferences",
  validate(updateNotificationPreferencesSchema),
  asyncHandler(notificationsController.updatePreferences),
);
