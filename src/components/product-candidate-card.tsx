"use client";

import { Save } from "lucide-react";
import { productCandidateToMealItem } from "@/lib/product-nutrition";
import type { ProductNutritionCandidate } from "@/lib/photo-client-schemas";
import {
  Field,
  numberFormat,
} from "@/components/photo-analyzer";

export function ProductCandidateCard({
  product,
  amountGrams,
  onAmountChange,
  onSave,
}: {
  readonly product: ProductNutritionCandidate;
  readonly amountGrams: number;
  readonly onAmountChange: (amount: number) => void;
  readonly onSave: (product: ProductNutritionCandidate) => void;
}) {
  const mealItem = productToMealItem(product, amountGrams);

  return (
    <div className="rounded-md border border-zinc-100 p-4">
      <div className="flex gap-3">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt=""
            referrerPolicy="no-referrer"
            loading="lazy"
            className="h-20 w-20 rounded-md object-cover"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-zinc-950">{product.name}</p>
          <p className="mt-1 text-sm text-zinc-500">
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
            onChange={(event) => onAmountChange(Number(event.target.value))}
            className="input"
          />
        </Field>
        <button
          type="button"
          onClick={() => onSave(product)}
          className="flex h-12 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <Save className="h-4 w-4" aria-hidden />
          기록 저장
        </button>
      </div>
      <p className="mt-3 text-sm text-zinc-600">
        저장값 {numberFormat(mealItem.calories)}kcal · 탄 {numberFormat(mealItem.carbs, 1)}g · 단{" "}
        {numberFormat(mealItem.protein, 1)}g · 지 {numberFormat(mealItem.fat, 1)}g · 나트륨{" "}
        {numberFormat(mealItem.sodiumMg)}mg
      </p>
      {product.dataQualityWarnings.length ? (
        <p className="mt-2 text-xs text-amber-700">{product.dataQualityWarnings.join(" ")}</p>
      ) : null}
    </div>
  );
}

export const productToMealItem = productCandidateToMealItem;
