import { Request, Response } from "express";

import { UsersService } from "./users.service";

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  public me = async (req: Request, res: Response): Promise<void> => {
    const user = await this.usersService.getCurrentUser(req.auth!.sub);
    res.status(200).json({ user });
  };

  public onboarding = async (req: Request, res: Response): Promise<void> => {
    const user = await this.usersService.completeOnboarding(req.auth!.sub, req.body);
    res.status(201).json({ user });
  };

  public updateMe = async (req: Request, res: Response): Promise<void> => {
    const user = await this.usersService.updateCurrentUser(req.auth!.sub, req.body);
    res.status(200).json({ user });
  };
}
