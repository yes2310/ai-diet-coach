import { describe, expect, it } from "vitest";
import { validateProductImageFile } from "../lib/product-photo-upload";
import { productPhotoIdentitySchema } from "../lib/validations";

describe("product photo validation", () => {
  it("accepts schema-valid AI identity with null nutrition facts", () => {
    const parsed = productPhotoIdentitySchema.parse({
      barcode: "3017624010701",
      productName: "Nutella",
      brand: "Ferrero",
      servingGrams: null,
      totalPackageGrams: null,
      estimatedConsumedGrams: null,
      nutritionPer100g: null,
      confidence: 0.7,
      note: "전면 포장만 보입니다.",
    });

    expect(parsed).toMatchObject({
      barcode: "3017624010701",
      productName: "Nutella",
      brand: "Ferrero",
    });
    expect(parsed.nutritionPer100g).toBeUndefined();
  });

  it("rejects oversized or non-image product files", () => {
    const oversized = new File(["x"], "large.jpg", { type: "image/jpeg" });
    Object.defineProperty(oversized, "size", { value: 9 * 1024 * 1024 });

    expect(validateProductImageFile(oversized)).toMatchObject({
      ok: false,
      status: 413,
    });
    expect(
      validateProductImageFile(new File(["text"], "note.txt", { type: "text/plain" })),
    ).toMatchObject({
      ok: false,
      status: 400,
    });
  });
});
