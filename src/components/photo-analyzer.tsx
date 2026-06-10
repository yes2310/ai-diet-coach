"use client";

import { Camera, PackageSearch } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { FoodPhotoAnalyzer } from "@/components/food-photo-analyzer";
import { ProductPhotoSearch } from "@/components/product-photo-search";

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export type MealItem = {
  readonly foodItemId?: string | null;
  readonly foodName: string;
  readonly amountGrams: number;
  readonly calories: number;
  readonly carbs: number;
  readonly protein: number;
  readonly fat: number;
  readonly sodiumMg: number;
  readonly sugar: number;
  readonly fiber: number;
};

export const mealLabels: Record<MealType, string> = {
  BREAKFAST: "아침",
  LUNCH: "점심",
  DINNER: "저녁",
  SNACK: "간식",
};

type PhotoMode = "food" | "product";

export function PhotoAnalyzer({
  dateKey,
  onSaved,
}: {
  readonly dateKey: string;
  readonly onSaved: () => void;
}) {
  const [mode, setMode] = useState<PhotoMode>("product");

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="식품 인식 방식"
        className="inline-flex rounded-md border border-[var(--line)] bg-white p-1 shadow-sm"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "product"}
          onClick={() => setMode("product")}
          className={modeButtonClass(mode === "product")}
        >
          <PackageSearch className="h-4 w-4" aria-hidden />
          포장식품 스캔
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "food"}
          onClick={() => setMode("food")}
          className={modeButtonClass(mode === "food")}
        >
          <Camera className="h-4 w-4" aria-hidden />
          일반 음식
        </button>
      </div>

      {mode === "product" ? (
        <ProductPhotoSearch dateKey={dateKey} onSaved={onSaved} />
      ) : (
        <FoodPhotoAnalyzer dateKey={dateKey} onSaved={onSaved} />
      )}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
}: {
  readonly title: string;
  readonly description?: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>
      {description ? (
        <p className="mt-1 break-keep text-sm leading-6 text-zinc-600">{description}</p>
      ) : null}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-800">
      {label}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

export function numberFormat(value = 0, digits = 0) {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: digits,
  }).format(value);
}

export function parseMealType(value: string): MealType {
  switch (value) {
    case "BREAKFAST":
      return "BREAKFAST";
    case "LUNCH":
      return "LUNCH";
    case "DINNER":
      return "DINNER";
    case "SNACK":
      return "SNACK";
    default:
      return "SNACK";
  }
}

export async function savePhotoMeal(input: {
  readonly dateKey: string;
  readonly mealType: MealType;
  readonly item: MealItem;
  readonly note: string;
}) {
  try {
    const response = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateKey: input.dateKey,
        mealType: input.mealType,
        note: input.note,
        items: [input.item],
      }),
    });
    const data: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return readError(data) ?? "사진 후보 저장에 실패했습니다.";
    }

    return "";
  } catch {
    return "사진 후보 저장에 실패했습니다.";
  }
}

function readError(value: unknown) {
  if (typeof value === "object" && value !== null && "error" in value) {
    const error = value.error;
    return typeof error === "string" ? error : null;
  }

  return null;
}

function modeButtonClass(active: boolean) {
  return [
    "flex h-10 items-center gap-2 rounded px-3 text-sm font-semibold transition",
    active ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-50",
  ].join(" ");
}
