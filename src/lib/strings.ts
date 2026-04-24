export function splitList(value: string | string[] | undefined | null) {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatList(values: string[] | undefined | null) {
  return values?.length ? values.join(", ") : "";
}
