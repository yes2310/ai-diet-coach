export type ProductAmountPreset = {
  readonly id: "serving" | "hundred" | "package";
  readonly label: string;
  readonly grams: number;
};

type ProductAmountBasis = {
  readonly servingGrams: number;
  readonly packageGrams: number | null;
};

type ProductAmountSeed = {
  readonly id: string;
  readonly servingGrams: number;
};

const minConsumedGrams = 1;
const maxConsumedGrams = 5000;

export function productAmountPresets(
  product: ProductAmountBasis,
): readonly ProductAmountPreset[] {
  const presets: ProductAmountPreset[] = [];
  addPreset(presets, {
    id: "serving",
    label: "1회분",
    grams: product.servingGrams,
  });
  addPreset(presets, { id: "hundred", label: "100g", grams: 100 });

  if (product.packageGrams !== null) {
    addPreset(presets, {
      id: "package",
      label: "전체",
      grams: product.packageGrams,
    });
  }

  return presets;
}

export function normalizeConsumedGrams(value: string, fallback: number) {
  const parsed = Number(value.trim());

  if (!Number.isFinite(parsed)) {
    return clampConsumedGrams(fallback);
  }

  return clampConsumedGrams(parsed);
}

export function normalizePhotoEstimatedConsumedGrams(value: number | undefined) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minConsumedGrams ||
    value > maxConsumedGrams
  ) {
    return undefined;
  }

  return roundConsumedGrams(value);
}

export function initialProductAmounts(
  products: readonly ProductAmountSeed[],
  photoEstimatedGrams?: number,
) {
  const photoAmount = normalizePhotoEstimatedConsumedGrams(photoEstimatedGrams);
  const amounts: Record<string, number> = {};

  for (const product of products) {
    amounts[product.id] = photoAmount ?? clampConsumedGrams(product.servingGrams);
  }

  return amounts;
}

function addPreset(
  presets: ProductAmountPreset[],
  preset: ProductAmountPreset,
) {
  const grams = clampConsumedGrams(preset.grams);

  if (presets.some((item) => item.grams === grams)) {
    return;
  }

  presets.push({ ...preset, grams });
}

function clampConsumedGrams(value: number) {
  if (!Number.isFinite(value)) {
    return 100;
  }

  return Math.min(maxConsumedGrams, Math.max(minConsumedGrams, roundConsumedGrams(value)));
}

function roundConsumedGrams(value: number) {
  return Math.round(value * 10) / 10;
}
