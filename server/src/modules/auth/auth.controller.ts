import { Request, Response } from "express";

import { AuthService } from "./auth.service";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public signup = async (req: Request, res: Response): Promise<void> => {
    const response = await this.authService.signup(req.body);
    res.status(201).json(response);
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    const response = await this.authService.login(req.body);
    res.status(200).json(response);
  };

  public refresh = async (req: Request, res: Response): Promise<void> => {
    const response = await this.authService.refresh(req.body.refreshToken);
    res.status(200).json(response);
  };
}
