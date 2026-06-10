import { describe, expect, it } from "vitest";
import {
  productSearchRequestTooLarge,
  readProductSearchForm,
} from "../lib/product-search-request";

describe("product search request parsing", () => {
  it("returns an empty form when the request has no form content type", async () => {
    const formData = await readProductSearchForm(
      new Request("http://localhost/api/photo/product-search", {
        method: "POST",
      }),
    );

    expect(formData.get("barcode")).toBeNull();
    expect(formData.get("query")).toBeNull();
  });

  it("detects product search requests larger than the server limit", () => {
    const request = new Request("http://localhost/api/photo/product-search", {
      method: "POST",
      headers: { "content-length": String(11 * 1024 * 1024) },
    });

    expect(productSearchRequestTooLarge(request)).toBe(true);
  });
});
