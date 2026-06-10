export function normalizeBarcode(value: unknown) {
  const raw =
    typeof value === "number" ? String(value) : typeof value === "string" ? value : "";
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 14 ? digits : "";
}
