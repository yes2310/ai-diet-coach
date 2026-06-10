import { describe, expect, it } from "vitest";
import {
  buildProductSearchFormData,
  hasProductSearchInput,
} from "../lib/product-search-form";

describe("product search form", () => {
  it("keeps barcode and amount photo together in the same search request", () => {
    const amountPhoto = new File(["portion"], "portion.jpg", { type: "image/jpeg" });

    const formData = buildProductSearchFormData({
      amountPhoto,
      barcode: "3017624010701",
      query: "",
    });

    expect(formData.get("image")).toBe(amountPhoto);
    expect(formData.get("barcode")).toBe("3017624010701");
    expect(formData.get("query")).toBe("");
    expect(
      hasProductSearchInput({
        amountPhoto,
        barcode: "3017624010701",
        query: "",
      }),
    ).toBe(true);
  });

  it("treats whitespace-only text without a photo as an empty search", () => {
    expect(
      hasProductSearchInput({
        amountPhoto: null,
        barcode: " ",
        query: "\n",
      }),
    ).toBe(false);
  });
});
