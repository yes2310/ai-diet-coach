import { z } from "zod";

const nutritionTotalsSchema = z.object({
  calories: z.number(),
  carbs: z.number(),
  protein: z.number(),
  fat: z.number(),
  sodiumMg: z.number(),
  sugar: z.number(),
  fiber: z.number(),
});

export const foodPhotoAnalyzeResponseSchema = z.object({
  error: z.string().optional(),
  analysis: z
    .object({
      needsUserConfirmation: z.boolean(),
      question: z.string(),
      candidates: z.array(
        z.object({
          name: z.string(),
          estimatedGrams: z.number(),
          calories: z.number(),
          carbs: z.number(),
          protein: z.number(),
          fat: z.number(),
          note: z.string().optional(),
        }),
      ),
    })
    .optional(),
});

export const productSearchResponseSchema = z.object({
  error: z.string().optional(),
  identity: z
    .object({
      barcode: z.string(),
      productName: z.string(),
      brand: z.string(),
      servingGrams: z.number().optional(),
      totalPackageGrams: z.number().optional(),
      estimatedConsumedGrams: z.number().optional(),
      confidence: z.number(),
      note: z.string(),
    })
    .optional(),
  products: z
    .array(
      z.object({
        id: z.string(),
        source: z.enum(["openfoodfacts", "photo-label"]),
        name: z.string(),
        brand: z.string(),
        barcode: z.string(),
        servingLabel: z.string(),
        servingGrams: z.number(),
        packageGrams: z.number().nullable(),
        imageUrl: z.string(),
        sourceUrl: z.string(),
        nutritionPer100g: nutritionTotalsSchema,
        dataQualityWarnings: z.array(z.string()),
      }),
    )
    .optional()
    .default([]),
});

export type ProductSearchResponse = z.infer<typeof productSearchResponseSchema>;
export type ProductNutritionCandidate = ProductSearchResponse["products"][number];
