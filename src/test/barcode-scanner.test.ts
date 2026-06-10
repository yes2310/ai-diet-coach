import { describe, expect, it } from "vitest";
import { normalizeBarcode } from "../lib/barcodes";
import {
  barcodePhotoScanFailureMessage,
  productBarcodeFromScanText,
  productZxingBarcodeFormatKeys,
} from "../lib/barcode-scanner";

describe("barcode scanner helpers", () => {
  it("normalizes product barcodes to digits only when the length is valid", () => {
    expect(normalizeBarcode("8 801234 567890")).toBe("8801234567890");
    expect(normalizeBarcode("12345")).toBe("");
  });

  it("keeps photo scanning focused on product barcode symbologies", () => {
    expect(productZxingBarcodeFormatKeys).toEqual([
      "EAN_13",
      "EAN_8",
      "UPC_A",
      "UPC_E",
      "CODE_128",
      "CODE_39",
      "ITF",
    ]);
  });

  it("reads product barcode text from image decoder results", () => {
    expect(productBarcodeFromScanText(" 301 7624010701 ")).toBe("3017624010701");
  });

  it("explains how to retry when a still barcode photo cannot be decoded", () => {
    expect(barcodePhotoScanFailureMessage).toContain("다시 촬영");
  });
});
