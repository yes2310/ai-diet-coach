export const maxProductImageBytes = 8 * 1024 * 1024;

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export type ProductImageValidation =
  | { readonly ok: true }
  | { readonly ok: false; readonly status: 400 | 413; readonly error: string };

export function validateProductImageFile(file: File): ProductImageValidation {
  if (file.size > maxProductImageBytes) {
    return {
      ok: false,
      status: 413,
      error: "상품 사진은 8MB 이하로 업로드하세요.",
    };
  }

  if (!allowedImageTypes.has(file.type.toLowerCase())) {
    return {
      ok: false,
      status: 400,
      error: "상품 사진은 JPG, PNG, WebP, HEIC 형식만 지원합니다.",
    };
  }

  return { ok: true };
}
