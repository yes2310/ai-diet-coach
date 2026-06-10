"use client";

import { Camera, ImagePlus, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { foodPhotoAnalyzeResponseSchema } from "@/lib/photo-client-schemas";
import { PhotoInput } from "@/components/photo-input";
import {
  Field,
  mealLabels,
  numberFormat,
  parseMealType,
  savePhotoMeal,
  SectionHeader,
  type MealItem,
  type MealType,
} from "@/components/photo-analyzer";

export function FoodPhotoAnalyzer({
  dateKey,
  onSaved,
}: {
  readonly dateKey: string;
  readonly onSaved: () => void;
}) {
  const [mealType, setMealType] = useState<MealType>("LUNCH");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [analysis, setAnalysis] = useState<{
    readonly candidates: readonly MealItem[];
    readonly question: string;
  } | null>(null);
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

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setMessage("");
    setAnalysis(null);

    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await fetch("/api/photo/analyze", {
        method: "POST",
        body: formData,
      });
      const parsed = foodPhotoAnalyzeResponseSchema.safeParse(
        await response.json().catch(() => null),
      );

      if (!parsed.success || !response.ok || !parsed.data.analysis) {
        setMessage(
          parsed.success
            ? parsed.data.error ?? "사진 분석에 실패했습니다."
            : "사진 분석 응답을 읽지 못했습니다.",
        );
        return;
      }

      setAnalysis({
        question: parsed.data.analysis.question,
        candidates: parsed.data.analysis.candidates.map((candidate) => ({
          foodName: candidate.name,
          amountGrams: candidate.estimatedGrams,
          calories: candidate.calories,
          carbs: candidate.carbs,
          protein: candidate.protein,
          fat: candidate.fat,
          sodiumMg: 0,
          sugar: 0,
          fiber: 0,
          foodItemId: null,
        })),
      });
    } catch {
      setMessage("사진 분석에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function saveCandidate(candidate: MealItem) {
    const error = await savePhotoMeal({
      dateKey,
      mealType,
      item: candidate,
      note: "사진 인식 후보에서 저장",
    });

    if (error) {
      setMessage(error);
      return;
    }

    setMessage("사진 후보를 식사 기록에 저장했습니다.");
    onSaved();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
        <SectionHeader
          title="음식 사진 인식"
          description="사진 후보는 저장 전 음식명과 중량을 확인하세요."
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
            <PhotoInput label="갤러리" icon={<ImagePlus className="h-4 w-4" />} onChange={selectFile} />
            <PhotoInput label="촬영" icon={<Camera className="h-4 w-4" />} capture onChange={selectFile} dark />
          </div>
          {file ? <p className="truncate text-xs text-zinc-500">{file.name}</p> : null}
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="업로드한 음식" className="aspect-[4/3] w-full rounded-lg object-cover" />
          ) : null}
          <button
            type="button"
            onClick={analyze}
            disabled={!file || loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            <Camera className="h-4 w-4" aria-hidden />
            {loading ? "분석 중..." : "사진 분석"}
          </button>
          {message ? <p className="text-sm text-zinc-700">{message}</p> : null}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
        <SectionHeader title="분석 후보" description="낮은 신뢰도 결과는 직접 수정해서 기록하세요." />
        {analysis ? (
          <div className="mt-5 space-y-3">
            <p className="rounded-md bg-amber-50 px-3 py-3 text-sm text-amber-900">
              {analysis.question}
            </p>
            {analysis.candidates.map((candidate, index) => (
              <FoodCandidate key={`${candidate.foodName}-${index}`} candidate={candidate} onSave={saveCandidate} />
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-md bg-zinc-50 px-3 py-4 text-sm text-zinc-500">
            사진을 분석하면 후보가 여기에 표시됩니다.
          </p>
        )}
      </section>
    </div>
  );
}

function FoodCandidate({
  candidate,
  onSave,
}: {
  readonly candidate: MealItem;
  readonly onSave: (candidate: MealItem) => void;
}) {
  return (
    <div className="rounded-md border border-zinc-100 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-zinc-950">{candidate.foodName}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {numberFormat(candidate.amountGrams)}g · {numberFormat(candidate.calories)}kcal
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            탄 {numberFormat(candidate.carbs, 1)}g · 단 {numberFormat(candidate.protein, 1)}g · 지{" "}
            {numberFormat(candidate.fat, 1)}g
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSave(candidate)}
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <Save className="h-4 w-4" aria-hidden />
          기록 저장
        </button>
      </div>
    </div>
  );
}
