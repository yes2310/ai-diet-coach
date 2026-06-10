import { z } from "zod";
import { calculateFoodAmount, round, type NutritionTotals } from "./nutrition";

const openFoodFactsBaseUrl = "https://world.openfoodfacts.org";

export type ProductSource = "openfoodfacts" | "photo-label";

export type ProductNutritionCandidate = {
  readonly id: string;
  readonly source: ProductSource;
  readonly name: string;
  readonly brand: string;
  readonly barcode: string;
  readonly servingLabel: string;
  readonly servingGrams: number;
  readonly packageGrams: number | null;
  readonly imageUrl: string;
  readonly sourceUrl: string;
  readonly nutritionPer100g: NutritionTotals;
  readonly dataQualityWarnings: readonly string[];
};

export type ProductMealItem = NutritionTotals & {
  readonly foodItemId: null;
  readonly foodName: string;
  readonly amountGrams: number;
};

export type PhotoLabelProductInput = {
  readonly productName: string;
  readonly brand: string;
  readonly barcode: string;
  readonly servingGrams?: number;
  readonly totalPackageGrams?: number;
  readonly nutritionPer100g?: Partial<NutritionTotals>;
};

export const offProductSchema = z.object({
  code: z.union([z.string(), z.number()]).optional(),
  product_name: z.string().optional().default(""),
  brands: z.string().optional().default(""),
  quantity: z.string().optional().default(""),
  product_quantity: z.union([z.string(), z.number()]).optional(),
  serving_quantity: z.union([z.string(), z.number()]).optional(),
  serving_size: z.string().optional().default(""),
  image_front_url: z.string().optional().default(""),
  image_url: z.string().optional().default(""),
  nutriments: z.record(z.string(), z.unknown()).optional().default({}),
});

export type OpenFoodFactsProductInput = z.input<typeof offProductSchema>;

export function normalizeOpenFoodFactsProduct(
  input: OpenFoodFactsProductInput,
): ProductNutritionCandidate | null {
  const product = offProductSchema.parse(input);
  const name = product.product_name.trim();
  const barcode = normalizeBarcode(product.code);
  const calories = readCalories(product.nutriments);

  if (!name || calories === null) {
    return null;
  }

  const servingGrams =
    readPositiveNumber(product.serving_quantity) ??
    parseGramText(product.serving_size) ??
    100;
  const packageGrams =
    readPositiveNumber(product.product_quantity) ?? parseGramText(product.quantity);

  return {
    id: `off:${barcode || name}`,
    source: "openfoodfacts",
    name,
    brand: product.brands.trim(),
    barcode,
    servingLabel: servingGrams === 100 ? "100g" : `${round(servingGrams, 1)}g`,
    servingGrams,
    packageGrams,
    imageUrl: openFoodFactsImageUrl(product.image_front_url, product.image_url),
    sourceUrl: barcode
      ? `${openFoodFactsBaseUrl}/product/${barcode}`
      : openFoodFactsBaseUrl,
    nutritionPer100g: {
      calories,
      carbs: readNutriment(product.nutriments, "carbohydrates_100g"),
      protein: readNutriment(product.nutriments, "proteins_100g"),
      fat: readNutriment(product.nutriments, "fat_100g"),
      sodiumMg: readSodiumMg(product.nutriments),
      sugar: readNutriment(product.nutriments, "sugars_100g"),
      fiber: readNutriment(product.nutriments, "fiber_100g"),
    },
    dataQualityWarnings: buildQualityWarnings(product.nutriments, packageGrams),
  };
}

export function createPhotoLabelProduct(
  input: PhotoLabelProductInput,
): ProductNutritionCandidate | null {
  const name = input.productName.trim();
  const calories = input.nutritionPer100g?.calories;

  if (!name || calories === undefined) {
    return null;
  }

  const barcode = normalizeBarcode(input.barcode);

  return {
    id: `photo:${barcode || name}`,
    source: "photo-label",
    name,
    brand: input.brand.trim(),
    barcode,
    servingLabel: "사진 라벨 100g",
    servingGrams: input.servingGrams ?? 100,
    packageGrams: input.totalPackageGrams ?? null,
    imageUrl: "",
    sourceUrl: "",
    nutritionPer100g: {
      calories,
      carbs: input.nutritionPer100g?.carbs ?? 0,
      protein: input.nutritionPer100g?.protein ?? 0,
      fat: input.nutritionPer100g?.fat ?? 0,
      sodiumMg: input.nutritionPer100g?.sodiumMg ?? 0,
      sugar: input.nutritionPer100g?.sugar ?? 0,
      fiber: input.nutritionPer100g?.fiber ?? 0,
    },
    dataQualityWarnings: ["사진에서 읽은 영양성분입니다. 저장 전 라벨과 비교하세요."],
  };
}

export function productCandidateToMealItem(
  product: ProductNutritionCandidate,
  consumedGrams: number,
): ProductMealItem {
  return {
    foodItemId: null,
    foodName: product.name,
    amountGrams: consumedGrams,
    ...calculateFoodAmount({
      amountGrams: consumedGrams,
      servingGrams: 100,
      ...product.nutritionPer100g,
    }),
  };
}

export function normalizeBarcode(value: unknown) {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value : "";
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 14 ? digits : "";
}

function readFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readPositiveNumber(value: unknown) {
  const parsed = readFiniteNumber(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

function parseGramText(value: string) {
  const match = value.match(/(\d+(?:[.,]\d+)?)\s*g\b/i);
  return match?.[1] ? readPositiveNumber(match[1].replace(",", ".")) : null;
}

function readNutriment(nutriments: Record<string, unknown>, key: string) {
  return round(readFiniteNumber(nutriments[key]) ?? 0, 1);
}

function readCalories(nutriments: Record<string, unknown>) {
  const kcal = readFiniteNumber(nutriments["energy-kcal_100g"]);

  if (kcal !== null) {
    return round(kcal);
  }

  const kj = readFiniteNumber(nutriments.energy_100g);
  return kj !== null ? round(kj / 4.184) : null;
}

function readSodiumMg(nutriments: Record<string, unknown>) {
  const sodiumGrams = readFiniteNumber(nutriments.sodium_100g);

  if (sodiumGrams !== null) {
    return round(sodiumGrams * 1000);
  }

  const saltGrams = readFiniteNumber(nutriments.salt_100g);
  return saltGrams !== null ? round(saltGrams * 393.4) : 0;
}

function buildQualityWarnings(
  nutriments: Record<string, unknown>,
  packageGrams: number | null,
) {
  const warnings: string[] = [];

  if (!packageGrams) {
    warnings.push("총 포장 중량을 확인하지 못했습니다.");
  }

  for (const key of ["carbohydrates_100g", "proteins_100g", "fat_100g"]) {
    if (readFiniteNumber(nutriments[key]) === null) {
      warnings.push("일부 영양성분이 비어 있어 0으로 계산했습니다.");
      break;
    }
  }

  return warnings;
}

function openFoodFactsImageUrl(...values: string[]) {
  for (const value of values) {
    try {
      const url = new URL(value);

      if (url.protocol === "https:" && url.hostname === "images.openfoodfacts.org") {
        return url.href;
      }
    } catch {
      continue;
    }
  }

  return "";
}
