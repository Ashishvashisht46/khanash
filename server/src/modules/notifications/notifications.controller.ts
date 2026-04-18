import { Request, Response } from "express";

import { NotificationsService } from "./notifications.service";

export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  public list = async (req: Request, res: Response): Promise<void> => {
    const payload = await this.notificationsService.listForUser(req.auth!.sub);
    res.status(200).json(payload);
  };

  public updatePreferences = async (req: Request, res: Response): Promise<void> => {
    const payload = await this.notificationsService.updatePreferences(req.auth!.sub, req.body);
    res.status(200).json(payload);
  };
}
