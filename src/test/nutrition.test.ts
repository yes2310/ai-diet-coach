import { describe, expect, it } from "vitest";
import {
  calculateBmr,
  calculateFoodAmount,
  calculateTargets,
  compareNutrition,
  sumMealItems,
} from "../lib/nutrition";

describe("nutrition calculations", () => {
  it("calculates BMR with the Mifflin-St Jeor formula", () => {
    expect(
      calculateBmr({
        gender: "MALE",
        age: 30,
        heightCm: 170,
        weightKg: 70,
      }),
    ).toBe(1618);

    expect(
      calculateBmr({
        gender: "FEMALE",
        age: 30,
        heightCm: 170,
        weightKg: 70,
      }),
    ).toBe(1452);
  });

  it("calculates target calories and macro grams for weight loss", () => {
    const targets = calculateTargets({
      gender: "MALE",
      age: 30,
      heightCm: 170,
      weightKg: 70,
      activityLevel: "LIGHT",
      goal: "LOSS",
    });

    expect(targets.bmr).toBe(1618);
    expect(targets.tdee).toBe(2225);
    expect(targets.calories).toBe(1825);
    expect(targets.carbs).toBe(183);
    expect(targets.protein).toBe(160);
    expect(targets.fat).toBe(51);
  });

  it("scales food nutrition by grams", () => {
    expect(
      calculateFoodAmount({
        amountGrams: 150,
        servingGrams: 100,
        calories: 152,
        carbs: 32,
        protein: 3,
        fat: 1,
      }),
    ).toMatchObject({
      calories: 228,
      carbs: 48,
      protein: 4.5,
      fat: 1.5,
    });
  });

  it("sums meal items and classifies nutrition status", () => {
    const totals = sumMealItems([
      {
        calories: 500,
        carbs: 80,
        protein: 20,
        fat: 10,
        sodiumMg: 500,
        sugar: 10,
        fiber: 6,
      },
      {
        calories: 300,
        carbs: 20,
        protein: 40,
        fat: 8,
        sodiumMg: 400,
        sugar: 5,
        fiber: 5,
      },
    ]);
    const targets = calculateTargets({
      gender: "MALE",
      age: 30,
      heightCm: 170,
      weightKg: 70,
      activityLevel: "LIGHT",
      goal: "MAINTAIN",
    });
    const comparisons = compareNutrition(targets, totals);

    expect(totals).toMatchObject({
      calories: 800,
      carbs: 100,
      protein: 60,
      fat: 18,
    });
    expect(comparisons.find((item) => item.key === "calories")?.status).toBe("LOW");
    expect(comparisons.find((item) => item.key === "sodiumMg")?.status).toBe("LOW");
  });
});
