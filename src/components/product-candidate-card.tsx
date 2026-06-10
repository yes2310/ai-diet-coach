"use client";

import clsx from "clsx";
import { AlertTriangle, Save, Scale } from "lucide-react";
import { useState } from "react";
import {
  type ProductAmountPreset,
  normalizePhotoEstimatedConsumedGrams,
  normalizeConsumedGrams,
  productAmountPresets,
} from "@/lib/product-amounts";
import { productCandidateToMealItem } from "@/lib/product-nutrition";
import type { ProductNutritionCandidate } from "@/lib/photo-client-schemas";
import {
  Field,
  numberFormat,
} from "@/components/photo-analyzer";

export function ProductCandidateCard({
  product,
  amountGrams,
  photoEstimatedGrams,
  onAmountChange,
  onSave,
}: {
  readonly product: ProductNutritionCandidate;
  readonly amountGrams: number;
  readonly photoEstimatedGrams?: number | undefined;
  readonly onAmountChange: (amount: number) => void;
  readonly onSave: (product: ProductNutritionCandidate) => void;
}) {
  const mealItem = productToMealItem(product, amountGrams);
  const presets = productAmountPresets(product);
  const photoAmount = normalizePhotoEstimatedConsumedGrams(photoEstimatedGrams);
  const [selectedPresetId, setSelectedPresetId] = useState("");

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <ProductImage src={product.imageUrl} alt={product.name} />
        <div className="min-w-0 flex-1">
          <p className="break-keep font-semibold leading-6 text-zinc-950">{product.name}</p>
          <p className="mt-1 break-keep text-sm text-zinc-500">
            {[product.brand, product.barcode || product.source].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            100g당 {numberFormat(product.nutritionPer100g.calories)}kcal · 탄{" "}
            {numberFormat(product.nutritionPer100g.carbs, 1)}g · 단{" "}
            {numberFormat(product.nutritionPer100g.protein, 1)}g · 지{" "}
            {numberFormat(product.nutritionPer100g.fat, 1)}g
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="먹은 양(g)">
          <input
            type="number"
            min={1}
            max={5000}
            value={amountGrams}
            onChange={(event) => {
              setSelectedPresetId("");
              onAmountChange(normalizeConsumedGrams(event.target.value, amountGrams));
            }}
            className="input"
          />
          {photoAmount !== undefined ? (
            <p className="mt-2 text-xs font-semibold text-blue-700">
              초기값: 사진 추정량 {numberFormat(photoAmount, 1)}g
            </p>
          ) : null}
        </Field>
        <div className="flex flex-wrap gap-2 sm:col-start-1">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setSelectedPresetId(preset.id);
                onAmountChange(preset.grams);
              }}
              className={clsx(
                "h-9 rounded-md border px-3 text-xs font-semibold transition",
                selectedPresetId === preset.id
                  ? "border-blue-700 bg-blue-700 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
              )}
            >
              {amountPresetButtonLabel(preset)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onSave(product)}
          className="flex h-12 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 sm:row-span-2"
        >
          <Save className="h-4 w-4" aria-hidden />
          기록 저장
        </button>
      </div>
      <div className="mt-4 rounded-md bg-blue-50 px-3 py-3 text-sm text-blue-950">
        <p className="text-xs font-semibold text-blue-700">저장 예정</p>
        <p className="mt-1 break-keep font-semibold">
          {numberFormat(mealItem.amountGrams, 1)}g · {numberFormat(mealItem.calories)}kcal
        </p>
        <p className="mt-1 text-blue-900">
          탄 {numberFormat(mealItem.carbs, 1)}g · 단 {numberFormat(mealItem.protein, 1)}g · 지{" "}
          {numberFormat(mealItem.fat, 1)}g · 나트륨 {numberFormat(mealItem.sodiumMg)}mg
        </p>
      </div>
      {product.dataQualityWarnings.length ? (
        <p className="mt-3 flex gap-2 text-xs leading-5 text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{product.dataQualityWarnings.join(" ")}</span>
        </p>
      ) : null}
    </div>
  );
}

export const productToMealItem = productCandidateToMealItem;

function amountPresetButtonLabel(preset: ProductAmountPreset) {
  const gramsLabel = `${numberFormat(preset.grams, 1)}g`;
  return preset.label === gramsLabel ? gramsLabel : `${preset.label} ${gramsLabel}`;
}

function ProductImage({
  src,
  alt,
}: {
  readonly src: string;
  readonly alt: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <ProductImageFallback />;
  }

  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-zinc-100 bg-zinc-100">
      {!loaded ? <ProductImageFallback /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={clsx(
          "absolute inset-0 h-full w-full object-cover transition-opacity",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

function ProductImageFallback() {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-500">
      <Scale className="h-6 w-6" aria-hidden />
    </div>
  );
}
