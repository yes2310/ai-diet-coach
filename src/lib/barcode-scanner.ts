import { normalizeBarcode } from "./barcodes";

type BarcodeFormatModule = typeof import("@zxing/library").BarcodeFormat;

export const productZxingBarcodeFormatKeys = [
  "EAN_13",
  "EAN_8",
  "UPC_A",
  "UPC_E",
  "CODE_128",
  "CODE_39",
  "ITF",
] as const satisfies readonly (keyof BarcodeFormatModule)[];

export const barcodePhotoScanFailureMessage =
  "사진에서 바코드를 읽지 못했습니다. 바코드가 화면 중앙에 크게 보이게 다시 촬영하세요.";

export function productBarcodeFromScanText(value: string) {
  return normalizeBarcode(value);
}

export async function decodeProductBarcodeFromImageFile(file: File) {
  const imageUrl = URL.createObjectURL(file);

  try {
    return await decodeProductBarcodeFromImageUrl(imageUrl);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

async function decodeProductBarcodeFromImageUrl(imageUrl: string) {
  const [{ BrowserMultiFormatOneDReader }, { BarcodeFormat, DecodeHintType }] =
    await Promise.all([
      import("@zxing/browser"),
      import("@zxing/library"),
    ]);
  const hints = new Map<
    typeof DecodeHintType[keyof typeof DecodeHintType],
    boolean | ReturnType<typeof productZxingFormats>
  >();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, productZxingFormats(BarcodeFormat));
  hints.set(DecodeHintType.TRY_HARDER, true);
  const reader = new BrowserMultiFormatOneDReader(hints);
  const result = await reader.decodeFromImageUrl(imageUrl);

  return productBarcodeFromScanText(result.getText());
}

function productZxingFormats(barcodeFormat: BarcodeFormatModule) {
  return productZxingBarcodeFormatKeys.map((key) => barcodeFormat[key]);
}
