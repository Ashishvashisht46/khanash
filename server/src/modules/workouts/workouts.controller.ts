import { Request, Response } from "express";

import { WorkoutsService } from "./workouts.service";

export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  public today = async (req: Request, res: Response): Promise<void> => {
    const workout = await this.workoutsService.getTodayWorkout(req.auth!.sub);
    res.status(200).json(workout);
  };

  public createSession = async (req: Request, res: Response): Promise<void> => {
    const session = await this.workoutsService.createSession(req.auth!.sub, req.body);
    res.status(201).json(session);
  };

  public history = async (req: Request, res: Response): Promise<void> => {
    const history = await this.workoutsService.getHistory(req.auth!.sub);
    res.status(200).json(history);
  };
}
