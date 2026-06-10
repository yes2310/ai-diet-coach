export const loginFailureReasonValues = [
  "invalid-input",
  "unknown-email",
  "wrong-password",
] as const;

export type LoginFailureReason = (typeof loginFailureReasonValues)[number];

const loginFailureMessages: Record<LoginFailureReason, string> = {
  "invalid-input": "이메일과 비밀번호를 확인하세요.",
  "unknown-email": "가입되지 않은 이메일입니다.",
  "wrong-password": "비밀번호가 올바르지 않습니다.",
};

const loginFailureStatuses: Record<LoginFailureReason, 400 | 401 | 404> = {
  "invalid-input": 400,
  "unknown-email": 404,
  "wrong-password": 401,
};

export function loginFailureMessage(reason: LoginFailureReason) {
  return loginFailureMessages[reason];
}

export function loginFailureStatus(reason: LoginFailureReason) {
  return loginFailureStatuses[reason];
}
