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

export type DashboardTabId = "home" | "meals" | "photo" | "analysis" | "profile";

const dashboardTitles: Record<DashboardTabId, string> = {
  home: "오늘 식단 상태",
  meals: "식사 기록",
  photo: "식품 스캔",
  analysis: "영양 분석",
  profile: "내 정보",
};

export function dashboardTitle(input: {
  readonly summary: { readonly profile: unknown | null } | null;
  readonly loading: boolean;
  readonly error: string;
  readonly activeTab?: DashboardTabId;
}) {
  if (!input.loading && !input.error && !hasCompletedProfile(input.summary)) {
    return "기본 정보 입력";
  }

  return dashboardTitles[input.activeTab ?? "home"];
}
