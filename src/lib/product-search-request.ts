export const maxProductSearchRequestBytes = 10 * 1024 * 1024;

export function productSearchRequestTooLarge(
  request: Request,
  maxBytes = maxProductSearchRequestBytes,
) {
  const rawLength = request.headers.get("content-length");

  if (!rawLength) {
    return false;
  }

  const contentLength = Number(rawLength);
  return Number.isFinite(contentLength) && contentLength > maxBytes;
}

export async function readProductSearchForm(request: Request) {
  try {
    return await request.formData();
  } catch (error) {
    if (error instanceof TypeError) {
      return new FormData();
    }

    throw error;
  }
}
