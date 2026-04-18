import type { JwtAccessPayload } from "../../modules/auth/auth.types";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      auth?: JwtAccessPayload;
    }
  }
}

export {};
