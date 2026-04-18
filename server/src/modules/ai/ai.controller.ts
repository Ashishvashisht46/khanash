import { Request, Response } from "express";

import { AiJobQueue } from "./ai.queue";
import { AiService } from "./ai.service";

export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly aiQueue: AiJobQueue,
  ) {}

  public workoutPlan = async (req: Request, res: Response): Promise<void> => {
    const response = await this.aiService.requestWorkoutPlan(req.auth!.sub);

    if (response.source === "job") {
      this.aiQueue.enqueue(response.jobId);
      res.status(202).json(response);
      return;
    }

    res.status(200).json(response);
  };

  public getJob = async (req: Request, res: Response): Promise<void> => {
    const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
    const job = await this.aiService.getJob(req.auth!.sub, jobId);
    res.status(200).json(job);
  };
}
