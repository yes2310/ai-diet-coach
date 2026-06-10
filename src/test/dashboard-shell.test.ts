import { describe, expect, it } from "vitest";
import {
  dashboardTitle,
  shouldShowDashboardNavigation,
} from "../lib/dashboard-shell";

describe("dashboard shell", () => {
  it("hides dashboard navigation while the required profile is missing", () => {
    const input = {
      summary: { profile: null },
      loading: false,
      error: "",
    };

    expect(shouldShowDashboardNavigation(input)).toBe(false);
    expect(dashboardTitle(input)).toBe("기본 정보 입력");
  });

  it("shows dashboard navigation once the profile exists", () => {
    const input = {
      summary: { profile: { age: 30 } },
      loading: false,
      error: "",
    };

    expect(shouldShowDashboardNavigation(input)).toBe(true);
    expect(dashboardTitle(input)).toBe("오늘 식단 상태");
  });
});
