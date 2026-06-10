import { describe, expect, it } from "vitest";
import { loginCheckResponseSchema } from "../lib/auth-client-schemas";
import {
  loginFailureMessage,
  loginFailureStatus,
} from "../lib/auth-feedback";

describe("auth feedback", () => {
  it("maps a wrong password to a specific user-facing message", () => {
    expect(loginFailureMessage("wrong-password")).toBe(
      "비밀번호가 올바르지 않습니다.",
    );
    expect(loginFailureStatus("wrong-password")).toBe(401);
  });

  it("parses login-check failure responses by reason", () => {
    const parsed = loginCheckResponseSchema.parse({
      ok: false,
      reason: "unknown-email",
      message: "가입되지 않은 이메일입니다.",
    });

    expect(parsed).toEqual({
      ok: false,
      reason: "unknown-email",
      message: "가입되지 않은 이메일입니다.",
    });
  });
});
