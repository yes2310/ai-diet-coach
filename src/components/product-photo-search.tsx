"use client";

import { Camera, ImagePlus, PackageSearch } from "lucide-react";
import { useEffect, useState } from "react";
import {
  productSearchResponseSchema,
  type ProductNutritionCandidate,
} from "@/lib/photo-client-schemas";
import { PhotoInput } from "@/components/photo-input";
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
  const [mealType, setMealType] = useState<MealType>("SNACK");
  const [file, setFile] = useState<File | null>(null);
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

  function selectFile(nextFile: File | null) {
    setFile(nextFile);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return nextFile ? URL.createObjectURL(nextFile) : "";
    });
  }

  async function searchProducts() {
    if (!file && !barcode.trim() && !query.trim()) return;
    setLoading(true);
    setMessage("");
    setProducts([]);

    const formData = new FormData();
    if (file) formData.append("image", file);
    formData.append("barcode", barcode);
    formData.append("query", query);

    try {
      const response = await fetch("/api/photo/product-search", {
        method: "POST",
        body: formData,
      });
      const parsed = productSearchResponseSchema.safeParse(
        await response.json().catch(() => null),
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
      setAmounts(initialAmounts(nextProducts, nextIdentity?.estimatedConsumedGrams));
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
          description="바코드와 상품명으로 영양정보를 찾고 실제 먹은 g만큼 저장합니다."
        />
        <div className="mt-5 space-y-4">
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
          <div className="grid gap-2 sm:grid-cols-2">
            <PhotoInput label="패키지 선택" icon={<ImagePlus className="h-4 w-4" />} onChange={selectFile} />
            <PhotoInput label="바코드 촬영" icon={<Camera className="h-4 w-4" />} capture onChange={selectFile} dark />
          </div>
          {file ? <p className="truncate text-xs text-zinc-500">{file.name}</p> : null}
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="업로드한 포장식품" className="aspect-[4/3] w-full rounded-lg object-cover" />
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="바코드">
              <input
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
                className="input"
                inputMode="numeric"
                placeholder="숫자"
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
            type="button"
            onClick={searchProducts}
            disabled={(!file && !barcode.trim() && !query.trim()) || loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            <PackageSearch className="h-4 w-4" aria-hidden />
            {loading ? "검색 중..." : "상품 검색"}
          </button>
          {identity?.note ? (
            <p className="rounded-md bg-zinc-50 px-3 py-3 text-sm text-zinc-600">{identity.note}</p>
          ) : null}
          {message ? <p className="text-sm text-zinc-700">{message}</p> : null}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
        <SectionHeader title="상품 후보" description="섭취량을 g 단위로 입력하면 영양값이 다시 계산됩니다." />
        {products.length ? (
          <div className="mt-5 space-y-3">
            {products.map((product) => (
              <ProductCandidateCard
                key={product.id}
                product={product}
                amountGrams={amounts[product.id] ?? 100}
                onAmountChange={(nextAmount) => setAmounts({ ...amounts, [product.id]: nextAmount })}
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

function initialAmounts(products: readonly ProductNutritionCandidate[], detectedAmount?: number) {
  return products.reduce<Record<string, number>>((acc, product) => {
    return { ...acc, [product.id]: detectedAmount ?? product.servingGrams ?? 100 };
  }, {});
}
