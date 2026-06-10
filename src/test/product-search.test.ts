import { afterEach, describe, expect, it, vi } from "vitest";
import { searchProductCandidates } from "../lib/product-search";

describe("product search", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("finds Shin Ramyun cup when the user searches with Korean product terms", async () => {
    const requestedSearchQueries: string[] = [];
    const fetchMock: typeof fetch = async (input) => {
      const url = requestUrl(input);

      if (url.hostname === "search.openfoodfacts.org") {
        const query = url.searchParams.get("q") ?? "";
        requestedSearchQueries.push(query);

        return jsonResponse({
          hits: query.toLowerCase().includes("shin")
            ? [{ code: "8801043264242" }]
            : [],
        });
      }

      if (url.pathname === "/api/v2/product/8801043264242.json") {
        return jsonResponse({
          product: {
            code: "8801043264242",
            product_name: "Shin Cup Noodle",
            brands: "Nongshim",
            quantity: "68 g",
            product_quantity: 68,
            serving_quantity: 68,
            serving_size: "68 g",
            nutriments: {
              "energy-kcal_100g": 429,
              carbohydrates_100g: 64,
              proteins_100g: 9,
              fat_100g: 14,
              sodium_100g: 1.8,
            },
          },
        });
      }

      return jsonResponse({});
    };

    vi.stubGlobal("fetch", fetchMock);

    const candidates = await searchProductCandidates({
      query: "신라면 컵",
      limit: 4,
    });

    expect(requestedSearchQueries).toContain("신라면 컵");
    expect(requestedSearchQueries.some((query) => query.includes("shin"))).toBe(true);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      barcode: "8801043264242",
      brand: "Nongshim",
      name: "Shin Cup Noodle",
      servingGrams: 68,
    });
  });

  it("prioritizes cup products when the Korean query includes cup intent", async () => {
    const fetchMock: typeof fetch = async (input) => {
      const url = requestUrl(input);

      if (url.hostname === "search.openfoodfacts.org") {
        return jsonResponse({
          hits: [
            { code: "14625060" },
            { code: "8801043264242" },
          ],
        });
      }

      if (url.pathname === "/api/v2/product/14625060.json") {
        return jsonResponse({
          product: productFixture({
            code: "14625060",
            productName: "Shin Ramen",
            servingGrams: 120,
          }),
        });
      }

      if (url.pathname === "/api/v2/product/8801043264242.json") {
        return jsonResponse({
          product: productFixture({
            code: "8801043264242",
            productName: "Shin Cup Noodle",
            servingGrams: 68,
          }),
        });
      }

      return jsonResponse({});
    };

    vi.stubGlobal("fetch", fetchMock);

    const candidates = await searchProductCandidates({
      query: "신라면 컵",
      limit: 4,
    });

    expect(candidates.map((candidate) => candidate.name)).toEqual([
      "Shin Cup Noodle",
      "Shin Ramen",
    ]);
  });
});

function requestUrl(input: Parameters<typeof fetch>[0]) {
  if (typeof input === "string") {
    return new URL(input);
  }

  if (input instanceof URL) {
    return input;
  }

  return new URL(input.url);
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
}

function productFixture({
  code,
  productName,
  servingGrams,
}: {
  readonly code: string;
  readonly productName: string;
  readonly servingGrams: number;
}) {
  return {
    code,
    product_name: productName,
    brands: "Nongshim",
    quantity: `${servingGrams} g`,
    product_quantity: servingGrams,
    serving_quantity: servingGrams,
    serving_size: `${servingGrams} g`,
    nutriments: {
      "energy-kcal_100g": 429,
      carbohydrates_100g: 64,
      proteins_100g: 9,
      fat_100g: 14,
      sodium_100g: 1.8,
    },
  };
}
