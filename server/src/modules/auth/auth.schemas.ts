import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email().trim().transform((value) => value.toLowerCase()),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password must be 72 characters or fewer."),
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().trim().transform((value) => value.toLowerCase()),
    password: z.string().min(1, "Password is required."),
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required."),
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});
