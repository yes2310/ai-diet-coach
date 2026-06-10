import { z } from "zod";
import { loginFailureReasonValues } from "./auth-feedback";

export const loginCheckResponseSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
  }),
  z.object({
    ok: z.literal(false),
    reason: z.enum(loginFailureReasonValues),
    message: z.string(),
  }),
]);

export const registerResponseSchema = z.union([
  z.object({
    ok: z.literal(true),
    email: z.string().email(),
  }),
  z.object({
    error: z.string(),
  }),
]);
