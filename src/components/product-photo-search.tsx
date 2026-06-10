"use client";

import { PackageSearch } from "lucide-react";
import { useEffect, useState } from "react";
import { defaultMealTypeForKoreaTime } from "@/lib/meal-defaults";
import { initialProductAmounts } from "@/lib/product-amounts";
import {
  buildProductSearchFormData,
  hasProductSearchInput,
} from "@/lib/product-search-form";
import {
  productSearchResponseSchema,
  type ProductNutritionCandidate,
} from "@/lib/photo-client-schemas";
import { readJsonResponse } from "@/lib/response-json";
import { ProductCaptureInputs } from "@/components/product-capture-inputs";
import { ProductCandidateCard, productToMealItem } from "@/components/product-candidate-card";
import {
  Field,
  mealLabels,
  parseMealType,
  savePhotoMeal,
  SectionHeader,
  type MealType,
} from "@/components/photo-analyzer";

type Identity = {
  readonly barcode: string;
  readonly productName: string;
  readonly brand: string;
  readonly estimatedConsumedGrams?: number;
  readonly note: string;
};

export function ProductPhotoSearch({
  dateKey,
  onSaved,
}: {
  readonly dateKey: string;
  readonly onSaved: () => void;
}) {
  const [mealType, setMealType] = useState<MealType>(defaultMealTypeForKoreaTime);
  const [amountPhoto, setAmountPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [barcode, setBarcode] = useState("");
  const [query, setQuery] = useState("");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [products, setProducts] = useState<readonly ProductNutritionCandidate[]>([]);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function selectAmountPhoto(nextPhoto: File | null) {
    setAmountPhoto(nextPhoto);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return nextPhoto ? URL.createObjectURL(nextPhoto) : "";
    });
  }

  async function searchProducts(input?: {
    readonly barcode?: string;
    readonly amountPhoto?: File | null;
    readonly query?: string;
  }) {
    const searchAmountPhoto =
      input?.amountPhoto === undefined ? amountPhoto : input.amountPhoto;
    const searchBarcode = input?.barcode ?? barcode;
    const searchQuery = input?.query ?? query;

    if (
      !hasProductSearchInput({
        amountPhoto: searchAmountPhoto,
        barcode: searchBarcode,
        query: searchQuery,
      })
    ) {
      return;
    }

    setLoading(true);
    setMessage("");
    setProducts([]);

    try {
      const response = await fetch("/api/photo/product-search", {
        method: "POST",
        body: buildProductSearchFormData({
          amountPhoto: searchAmountPhoto,
          barcode: searchBarcode,
          query: searchQuery,
        }),
      });
      const parsed = productSearchResponseSchema.safeParse(
        await readJsonResponse(response),
      );

      if (!parsed.success || !response.ok) {
        setMessage(
          parsed.success
            ? parsed.data.error ?? "상품 검색에 실패했습니다."
            : "상품 검색 응답을 읽지 못했습니다.",
        );
        return;
      }

      const nextIdentity = parsed.data.identity ?? null;
      const nextProducts = parsed.data.products;
      setIdentity(nextIdentity);
      setProducts(nextProducts);
      setAmounts(initialProductAmounts(nextProducts, nextIdentity?.estimatedConsumedGrams));
      setMessage(
        nextProducts.length
          ? ""
          : "상품 후보를 찾지 못했습니다. 바코드나 상품명을 직접 입력해 보세요.",
      );
    } catch {
      setMessage("상품 검색에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleBarcodeDetected(nextBarcode: string) {
    setBarcode(nextBarcode);
    void searchProducts({ barcode: nextBarcode });
  }

  async function saveProduct(product: ProductNutritionCandidate) {
    const amountGrams = amounts[product.id] ?? identity?.estimatedConsumedGrams ?? 100;
    const error = await savePhotoMeal({
      dateKey,
      mealType,
      item: productToMealItem(product, amountGrams),
      note: product.source === "openfoodfacts" ? "상품 검색 후보에서 저장" : "사진 라벨 후보에서 저장",
    });

    if (error) {
      setMessage(error);
      return;
    }

    setMessage("섭취량 기준으로 식사 기록에 저장했습니다.");
    onSaved();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
        <SectionHeader
          title="포장식품 검색"
          description="바코드는 사진으로 추출하고, 섭취량 사진은 먹은 양을 g 단위로 추정합니다."
        />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void searchProducts();
          }}
          className="mt-5 space-y-4"
        >
          <Field label="식사 구분">
            <select
              value={mealType}
              onChange={(event) => setMealType(parseMealType(event.target.value))}
              className="input"
            >
              {Object.entries(mealLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <ProductCaptureInputs
            amountPhoto={amountPhoto}
            barcode={barcode}
            loading={loading}
            previewUrl={previewUrl}
            onAmountPhotoChange={selectAmountPhoto}
            onBarcodeDetected={handleBarcodeDetected}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="바코드">
              <input
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
                className="input"
                inputMode="numeric"
                placeholder="촬영 또는 숫자 입력"
              />
            </Field>
            <Field label="상품명">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="input"
                placeholder="예: 신라면 컵"
              />
            </Field>
          </div>
          <button
            type="submit"
            disabled={
              !hasProductSearchInput({ amountPhoto, barcode, query }) || loading
            }
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            <PackageSearch className="h-4 w-4" aria-hidden />
            {loading ? "검색 중..." : "상품 검색"}
          </button>
          {identity?.note ? (
            <p className="rounded-md bg-zinc-50 px-3 py-3 text-sm text-zinc-600">{identity.note}</p>
          ) : null}
          {message ? <p aria-live="polite" className="text-sm text-zinc-700">{message}</p> : null}
        </form>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
        <SectionHeader title="상품 후보" description="섭취량을 g 단위로 입력하면 영양값이 다시 계산됩니다." />
        {loading ? (
          <div className="mt-5 rounded-md bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
            <div className="h-2 w-28 animate-pulse rounded-full bg-zinc-200" />
            <p className="mt-3">상품 정보를 찾고 있습니다.</p>
          </div>
        ) : products.length ? (
          <div className="mt-5 space-y-3">
            {products.map((product) => (
              <ProductCandidateCard
                key={product.id}
                product={product}
                amountGrams={amounts[product.id] ?? 100}
                photoEstimatedGrams={identity?.estimatedConsumedGrams}
                onAmountChange={(nextAmount) =>
                  setAmounts((currentAmounts) => ({
                    ...currentAmounts,
                    [product.id]: nextAmount,
                  }))
                }
                onSave={saveProduct}
              />
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-md bg-zinc-50 px-3 py-4 text-sm text-zinc-500">
            검색하면 상품 후보가 여기에 표시됩니다.
          </p>
        )}
      </section>
    </div>
  );
}
