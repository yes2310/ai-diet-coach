import { describe, expect, it } from "vitest";
import { defaultMealTypeForKoreaTime } from "../lib/meal-defaults";

describe("meal defaults", () => {
  it("selects breakfast for Korean morning access time", () => {
    expect(defaultMealTypeForKoreaTime(new Date("2026-06-09T22:30:00.000Z"))).toBe(
      "BREAKFAST",
    );
  });

  it("selects lunch for Korean midday access time", () => {
    expect(defaultMealTypeForKoreaTime(new Date("2026-06-10T04:00:00.000Z"))).toBe(
      "LUNCH",
    );
  });

  it("selects dinner for Korean evening access time", () => {
    expect(defaultMealTypeForKoreaTime(new Date("2026-06-10T10:30:00.000Z"))).toBe(
      "DINNER",
    );
  });

  it("selects snack outside Korean meal windows", () => {
    expect(defaultMealTypeForKoreaTime(new Date("2026-06-10T07:30:00.000Z"))).toBe(
      "SNACK",
    );
    expect(defaultMealTypeForKoreaTime(new Date("2026-06-10T15:30:00.000Z"))).toBe(
      "SNACK",
    );
  });
});
