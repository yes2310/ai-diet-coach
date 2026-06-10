export function hasCompletedProfile(
  summary: { readonly profile: unknown | null } | null,
) {
  return Boolean(summary?.profile);
}

export function shouldShowDashboardNavigation(input: {
  readonly summary: { readonly profile: unknown | null } | null;
  readonly loading: boolean;
  readonly error: string;
}) {
  return hasCompletedProfile(input.summary) && !input.loading && !input.error;
}

export function dashboardTitle(input: {
  readonly summary: { readonly profile: unknown | null } | null;
  readonly loading: boolean;
  readonly error: string;
}) {
  if (!input.loading && !input.error && !hasCompletedProfile(input.summary)) {
    return "기본 정보 입력";
  }

  return "오늘 식단 상태";
}
