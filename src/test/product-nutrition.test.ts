import { describe, expect, it } from "vitest";
import {
  normalizeOpenFoodFactsProduct,
  productCandidateToMealItem,
} from "../lib/product-search";

describe("packaged product nutrition", () => {
  it("normalizes Open Food Facts nutriments into a product candidate", () => {
    const candidate = normalizeOpenFoodFactsProduct({
      code: "3017624010701",
      product_name: "Nutella",
      brands: "Ferrero",
      quantity: "400 g",
      product_quantity: 400,
      nutriments: {
        "energy-kcal_100g": 539,
        carbohydrates_100g: 57.5,
        proteins_100g: 6.3,
        fat_100g: 30.9,
        sodium_100g: 0.043,
        sugars_100g: 56.3,
        fiber_100g: 0,
      },
    });

    expect(candidate).toMatchObject({
      barcode: "3017624010701",
      brand: "Ferrero",
      name: "Nutella",
      servingGrams: 100,
      nutritionPer100g: {
        calories: 539,
        carbs: 57.5,
        protein: 6.3,
        fat: 30.9,
        sodiumMg: 43,
        sugar: 56.3,
        fiber: 0,
      },
    });
  });

  it("drops non Open Food Facts image URLs from product candidates", () => {
    const candidate = normalizeOpenFoodFactsProduct({
      code: "3017624010701",
      product_name: "Nutella",
      image_front_url: "https://tracker.example.test/pixel.png",
      image_url: "https://images.openfoodfacts.org/images/products/301/762/401/0701/front_en.100.400.jpg",
      nutriments: {
        "energy-kcal_100g": 539,
        carbohydrates_100g: 57.5,
        proteins_100g: 6.3,
        fat_100g: 30.9,
      },
    });

    expect(candidate?.imageUrl).toBe(
      "https://images.openfoodfacts.org/images/products/301/762/401/0701/front_en.100.400.jpg",
    );
  });

  it("calculates the meal item from the grams the user actually ate", () => {
    const candidate = normalizeOpenFoodFactsProduct({
      code: "3017624010701",
      product_name: "Nutella",
      nutriments: {
        "energy-kcal_100g": 539,
        carbohydrates_100g: 57.5,
        proteins_100g: 6.3,
        fat_100g: 30.9,
        sodium_100g: 0.043,
        sugars_100g: 56.3,
        fiber_100g: 0,
      },
    });

    expect(candidate).not.toBeNull();

    if (!candidate) {
      return;
    }

    expect(productCandidateToMealItem(candidate, 37)).toMatchObject({
      foodItemId: null,
      foodName: "Nutella",
      amountGrams: 37,
      calories: 199,
      carbs: 21.3,
      protein: 2.3,
      fat: 11.4,
      sodiumMg: 16,
      sugar: 20.8,
      fiber: 0,
    });
  });
});
