import { describe, expect, it } from "vitest";
import {
  initialProductAmounts,
  normalizePhotoEstimatedConsumedGrams,
  productAmountPresets,
  normalizeConsumedGrams,
} from "../lib/product-amounts";

describe("product amount helpers", () => {
  it("builds practical quick-pick amounts without duplicates", () => {
    const presets = productAmountPresets({
      servingGrams: 30,
      packageGrams: 400,
    });

    expect(presets).toEqual([
      { id: "serving", label: "1회분", grams: 30 },
      { id: "hundred", label: "100g", grams: 100 },
      { id: "package", label: "전체", grams: 400 },
    ]);
  });

  it("normalizes consumed grams to the app-supported range", () => {
    expect(normalizeConsumedGrams(" 37.5 ", 100)).toBe(37.5);
    expect(normalizeConsumedGrams("0", 100)).toBe(1);
    expect(normalizeConsumedGrams("9999", 100)).toBe(5000);
    expect(normalizeConsumedGrams("not a number", 125)).toBe(125);
  });

  it("uses a photo-estimated amount as the initial amount for every product", () => {
    expect(
      initialProductAmounts(
        [
          { id: "nutella", servingGrams: 15 },
          { id: "photo-label", servingGrams: 100 },
        ],
        37.46,
      ),
    ).toEqual({
      nutella: 37.5,
      "photo-label": 37.5,
    });
  });

  it("falls back to serving grams when a photo estimate is unavailable", () => {
    expect(
      initialProductAmounts(
        [
          { id: "ramen", servingGrams: 120 },
          { id: "chips", servingGrams: 0 },
        ],
        Number.NaN,
      ),
    ).toEqual({
      ramen: 120,
      chips: 1,
    });
    expect(normalizePhotoEstimatedConsumedGrams(0)).toBeUndefined();
    expect(normalizePhotoEstimatedConsumedGrams(5000.04)).toBeUndefined();
  });
});
