import bcrypt from "bcryptjs";
import crypto from "crypto";

import { env } from "../config/env";

export const hashPassword = async (value: string): Promise<string> =>
  bcrypt.hash(value, env.BCRYPT_SALT_ROUNDS);

export const comparePassword = async (value: string, hash: string): Promise<boolean> =>
  bcrypt.compare(value, hash);

export const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");
