import { Request, Response } from "express";

import { GamificationService } from "./gamification.service";

export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  public summary = async (req: Request, res: Response): Promise<void> => {
    const summary = await this.gamificationService.getSummary(req.auth!.sub);
    res.status(200).json(summary);
  };

  public badges = async (req: Request, res: Response): Promise<void> => {
    const badges = await this.gamificationService.getBadges(req.auth!.sub);
    res.status(200).json({ badges });
  };
}
