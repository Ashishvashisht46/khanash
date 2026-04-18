import { Router } from "express";
import rateLimit from "express-rate-limit";

import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/async-handler";
import { AuthController } from "./auth.controller";
import { AuthRepository } from "./auth.repository";
import { loginSchema, refreshSchema, signupSchema } from "./auth.schemas";
import { AuthService } from "./auth.service";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many authentication requests. Please try again later.",
    code: "RATE_LIMITED",
  },
});

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

export const authRouter = Router();

authRouter.post("/signup", authLimiter, validate(signupSchema), asyncHandler(authController.signup));
authRouter.post("/login", authLimiter, validate(loginSchema), asyncHandler(authController.login));
authRouter.post("/refresh", authLimiter, validate(refreshSchema), asyncHandler(authController.refresh));
