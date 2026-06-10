import { z } from "zod";
import {
  normalizeBarcode,
  normalizeOpenFoodFactsProduct,
  offProductSchema,
  type ProductNutritionCandidate,
} from "./product-nutrition";

export {
  createPhotoLabelProduct,
  normalizeOpenFoodFactsProduct,
  productCandidateToMealItem,
  type PhotoLabelProductInput,
  type ProductMealItem,
  type ProductNutritionCandidate,
  type ProductSource,
} from "./product-nutrition";

const productFields = [
  "code",
  "product_name",
  "brands",
  "quantity",
  "product_quantity",
  "serving_quantity",
  "serving_size",
  "image_front_url",
  "image_url",
  "nutriments",
].join(",");

const openFoodFactsBaseUrl = "https://world.openfoodfacts.org";
const searchBaseUrl = "https://search.openfoodfacts.org";
const defaultUserAgent =
  "ai-diet-coach/0.1.0 (https://github.com/yes2310/ai-diet-coach)";

const offProductResponseSchema = z.object({
  product: offProductSchema.optional(),
});

const searchHitSchema = z.object({
  code: z.union([z.string(), z.number()]),
});

const searchResponseSchema = z.object({
  hits: z.array(searchHitSchema).optional().default([]),
});

export async function searchProductCandidates(input: {
  readonly barcode?: string;
  readonly query?: string;
  readonly limit?: number;
}): Promise<ProductNutritionCandidate[]> {
  const limit = input.limit ?? 4;
  const candidates: ProductNutritionCandidate[] = [];
  const barcode = normalizeBarcode(input.barcode);

  if (barcode) {
    const candidate = await fetchProductByBarcode(barcode);

    if (candidate) {
      candidates.push(candidate);
    }
  }

  if (input.query && candidates.length < limit) {
    const codes = await searchProductCodes(input.query, limit);

    for (const code of codes) {
      if (candidates.some((candidate) => candidate.barcode === code)) {
        continue;
      }

      const candidate = await fetchProductByBarcode(code);

      if (candidate) {
        candidates.push(candidate);
      }

      if (candidates.length >= limit) {
        break;
      }
    }
  }

  return candidates.slice(0, limit);
}

async function fetchProductByBarcode(barcode: string) {
  const url = new URL(`/api/v2/product/${barcode}.json`, openFoodFactsBaseUrl);
  url.searchParams.set("fields", productFields);

  const json = await fetchJson(url);
  const parsed = offProductResponseSchema.safeParse(json);

  if (!parsed.success || !parsed.data.product) {
    return null;
  }

  return normalizeOpenFoodFactsProduct(parsed.data.product);
}

async function searchProductCodes(query: string, limit: number) {
  const url = new URL("/search", searchBaseUrl);
  url.searchParams.set("q", query);
  url.searchParams.set("page_size", String(Math.min(limit, 4)));

  const json = await fetchJson(url);
  const parsed = searchResponseSchema.safeParse(json);

  if (!parsed.success) {
    return [];
  }

  return parsed.data.hits
    .map((hit) => normalizeBarcode(hit.code))
    .filter(Boolean)
    .slice(0, limit);
}

async function fetchJson(url: URL): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": process.env.OPEN_FOOD_FACTS_USER_AGENT || defaultUserAgent,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok || !response.headers.get("content-type")?.includes("json")) {
      return null;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      return null;
    }

    throw error;
  }
}
