"use client";

import clsx from "clsx";
import { signOut } from "next-auth/react";
import {
  Activity,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DesktopDashboardNavigation,
  MobileDashboardNavigation,
  type TabId,
} from "@/components/dashboard-navigation";
import { PhotoAnalyzer } from "@/components/photo-analyzer";
import {
  dashboardTitle,
  shouldShowDashboardNavigation,
} from "@/lib/dashboard-shell";
import { formatList } from "@/lib/strings";

type Gender = "MALE" | "FEMALE" | "OTHER";
type ActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE";
type Goal = "LOSS" | "MAINTAIN" | "GAIN" | "MUSCLE";
type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
type Status = "LOW" | "OK" | "HIGH";

type Profile = {
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  allergies: string[];
  conditions: string[];
  preferredFoods: string[];
  dislikedFoods: string[];
};

type FoodItem = {
  id: string;
  name: string;
  servingLabel: string;
  servingGrams: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sodiumMg: number;
  sugar: number;
  fiber: number;
};

type MealItem = {
  id?: string;
  foodItemId?: string | null;
  foodName: string;
  amountGrams: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sodiumMg: number;
  sugar: number;
  fiber: number;
};

type Meal = {
  id: string;
  dateKey: string;
  mealType: MealType;
  note?: string | null;
  items: MealItem[];
};

type Totals = {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sodiumMg: number;
  sugar: number;
  fiber: number;
};

type Targets = Totals & {
  bmr: number;
  tdee: number;
  calorieAdjustment: number;
  macroRatios: Record<"carbs" | "protein" | "fat", number>;
};

type Comparison = {
  key: keyof Totals;
  label: string;
  target: number;
  actual: number;
  unit: string;
  status: Status;
  delta: number;
};

type Feedback = {
  source: "chatmock" | "rule";
  model?: string;
  text: string;
};

type Summary = {
  profile: Profile | null;
  meals: Meal[];
  targets: Targets | null;
  totals: Totals | null;
  comparisons: Comparison[];
  warnings: string[];
  feedback: Feedback | null;
};

const genderLabels: Record<Gender, string> = {
  MALE: "남성",
  FEMALE: "여성",
  OTHER: "기타",
};

const activityLabels: Record<ActivityLevel, string> = {
  SEDENTARY: "거의 운동 안 함",
  LIGHT: "가벼운 활동",
  MODERATE: "보통 활동",
  ACTIVE: "운동 많음",
};

const goalLabels: Record<Goal, string> = {
  LOSS: "감량",
  MAINTAIN: "유지",
  GAIN: "증량",
  MUSCLE: "근육 증가",
};

const mealLabels: Record<MealType, string> = {
  BREAKFAST: "아침",
  LUNCH: "점심",
  DINNER: "저녁",
  SNACK: "간식",
};

function todayKey() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function numberFormat(value = 0, digits = 0) {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: digits,
  }).format(value);
}

function progress(actual = 0, target = 1) {
  if (!target) {
    return 0;
  }

  return Math.min(100, Math.max(0, (actual / target) * 100));
}

function statusText(status: Status) {
  if (status === "LOW") return "부족";
  if (status === "HIGH") return "과다";
  return "적정";
}

function statusClass(status: Status) {
  if (status === "LOW") return "bg-amber-50 text-amber-800 border-amber-200";
  if (status === "HIGH") return "bg-red-50 text-red-800 border-red-200";
  return "bg-emerald-50 text-emerald-800 border-emerald-200";
}

function feedbackLines(text?: string) {
  return (text ?? "식사 기록을 추가하면 피드백이 표시됩니다.")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function itemTotal(items: MealItem[]) {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      carbs: acc.carbs + item.carbs,
      protein: acc.protein + item.protein,
      fat: acc.fat + item.fat,
      sodiumMg: acc.sodiumMg + item.sodiumMg,
      sugar: acc.sugar + item.sugar,
      fiber: acc.fiber + item.fiber,
    }),
    {
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      sodiumMg: 0,
      sugar: 0,
      fiber: 0,
    },
  );
}

function scaleFood(food: FoodItem, amountGrams: number): MealItem {
  const ratio = amountGrams / food.servingGrams;

  return {
    foodItemId: food.id,
    foodName: food.name,
    amountGrams,
    calories: Math.round(food.calories * ratio),
    carbs: Math.round(food.carbs * ratio * 10) / 10,
    protein: Math.round(food.protein * ratio * 10) / 10,
    fat: Math.round(food.fat * ratio * 10) / 10,
    sodiumMg: Math.round(food.sodiumMg * ratio),
    sugar: Math.round(food.sugar * ratio * 10) / 10,
    fiber: Math.round(food.fiber * ratio * 10) / 10,
  };
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm leading-6 text-zinc-600">{description}</p>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-4 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-950">
        {value}
        {unit ? <span className="ml-1 text-sm font-medium text-zinc-500">{unit}</span> : null}
      </p>
    </div>
  );
}

function ProgressRow({
  label,
  actual,
  target,
  unit,
}: {
  label: string;
  actual: number;
  target: number;
  unit: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-zinc-800">{label}</span>
        <span className="text-zinc-500">
          {numberFormat(actual, 1)} / {numberFormat(target, 1)}
          {unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100">
        <div
          className="h-2 rounded-full bg-blue-600"
          style={{ width: `${progress(actual, target)}%` }}
        />
      </div>
    </div>
  );
}

export function DashboardApp({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [dateKey, setDateKey] = useState(todayKey());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    const response = await fetch(`/api/summary?date=${dateKey}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      setError("데이터를 불러오지 못했습니다. DB 연결과 로그인 상태를 확인하세요.");
      setLoading(false);
      return;
    }

    const data = (await response.json()) as Summary;
    setSummary(data);
    setLoading(false);
  }, [dateKey]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void loadSummary();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadSummary]);

  const content = useMemo(() => {
    if (error) {
      return <ErrorPanel message={error} onRetry={loadSummary} />;
    }

    if (loading || !summary) {
      return <LoadingPanel />;
    }

    if (!summary.profile) {
      return (
        <ProfilePanel
          profile={summary.profile}
          onSaved={() => {
            setActiveTab("home");
            void loadSummary();
          }}
          onboarding
        />
      );
    }

    if (activeTab === "home") {
      return <HomePanel summary={summary} dateKey={dateKey} setDateKey={setDateKey} onRefresh={loadSummary} />;
    }

    if (activeTab === "meals") {
      return <MealLogger dateKey={dateKey} meals={summary.meals} onChanged={loadSummary} />;
    }

    if (activeTab === "photo") {
      return <PhotoAnalyzer dateKey={dateKey} onSaved={loadSummary} />;
    }

    if (activeTab === "analysis") {
      return <AnalysisPanel summary={summary} onRefresh={loadSummary} />;
    }

    return (
      <ProfilePanel
        profile={summary.profile}
        onSaved={() => void loadSummary()}
        userEmail={userEmail}
      />
    );
  }, [activeTab, dateKey, error, loadSummary, loading, summary, userEmail]);

  const showNavigation = shouldShowDashboardNavigation({ summary, loading, error });
  const pageTitle = dashboardTitle({ summary, loading, error });

  return (
    <main
      className={clsx(
        "min-h-dvh bg-[var(--background)]",
        showNavigation ? "pb-24 lg:pb-0" : "pb-0",
      )}
    >
      <div
        className={clsx(
          "mx-auto grid min-h-dvh w-full",
          showNavigation
            ? "max-w-7xl lg:grid-cols-[230px_1fr]"
            : "max-w-3xl",
        )}
      >
        {showNavigation ? (
          <DesktopDashboardNavigation
            activeTab={activeTab}
            userName={userName}
            onSelect={setActiveTab}
          />
        ) : null}
        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-zinc-500">안녕하세요, {userName}님</p>
              <h1 className="mt-1 text-2xl font-semibold text-zinc-950">
                {pageTitle}
              </h1>
            </div>
            <button
              onClick={() => void loadSummary()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              새로고침
            </button>
          </header>

          {content}
        </section>
      </div>

      {showNavigation ? (
        <MobileDashboardNavigation activeTab={activeTab} onSelect={setActiveTab} />
      ) : null}
    </main>
  );
}

function LoadingPanel() {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-6 text-sm text-zinc-600 shadow-sm">
      데이터를 불러오는 중입니다.
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">
      <p>{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 h-10 rounded-md bg-red-700 px-4 text-sm font-semibold text-white"
      >
        다시 시도
      </button>
    </div>
  );
}

function HomePanel({
  summary,
  dateKey,
  setDateKey,
  onRefresh,
}: {
  summary: Summary;
  dateKey: string;
  setDateKey: (date: string) => void;
  onRefresh: () => void;
}) {
  const targets = summary.targets;
  const totals = summary.totals;

  if (!targets || !totals) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-[var(--line)] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-800">기록 날짜</p>
          <p className="mt-1 text-sm text-zinc-500">날짜별 식사 기록과 분석을 확인합니다.</p>
        </div>
        <input
          type="date"
          value={dateKey}
          onChange={(event) => setDateKey(event.target.value)}
          className="h-11 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-blue-500"
        />
      </div>

      {summary.warnings.length ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {summary.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="목표 칼로리" value={numberFormat(targets.calories)} unit="kcal" />
        <Metric label="섭취 칼로리" value={numberFormat(totals.calories)} unit="kcal" />
        <Metric label="BMR" value={numberFormat(targets.bmr)} unit="kcal" />
        <Metric label="TDEE" value={numberFormat(targets.tdee)} unit="kcal" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <SectionHeader
            title="탄단지 진행률"
            description="목표 칼로리와 목표별 탄단지 비율을 g 단위로 비교합니다."
          />
          <div className="mt-5 space-y-5">
            <ProgressRow label="칼로리" actual={totals.calories} target={targets.calories} unit="kcal" />
            <ProgressRow label="탄수화물" actual={totals.carbs} target={targets.carbs} unit="g" />
            <ProgressRow label="단백질" actual={totals.protein} target={targets.protein} unit="g" />
            <ProgressRow label="지방" actual={totals.fat} target={targets.fat} unit="g" />
          </div>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <SectionHeader title="AI 피드백" />
            <span className="text-xs font-medium text-zinc-500">
              {summary.feedback?.model ?? "규칙 기반"}
            </span>
          </div>
          <div className="mt-4 space-y-2 text-sm leading-6 text-zinc-700">
            {feedbackLines(summary.feedback?.text).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <button
            onClick={onRefresh}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-md border border-[var(--line)] px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <Activity className="h-4 w-4" aria-hidden />
            피드백 갱신
          </button>
        </section>
      </div>
    </div>
  );
}

function ProfilePanel({
  profile,
  onSaved,
  onboarding,
  userEmail,
}: {
  profile: Profile | null;
  onSaved: () => void;
  onboarding?: boolean;
  userEmail?: string;
}) {
  const [form, setForm] = useState({
    age: profile?.age ?? 30,
    gender: profile?.gender ?? "MALE",
    heightCm: profile?.heightCm ?? 170,
    weightKg: profile?.weightKg ?? 70,
    activityLevel: profile?.activityLevel ?? "LIGHT",
    goal: profile?.goal ?? "LOSS",
    allergies: formatList(profile?.allergies),
    conditions: formatList(profile?.conditions),
    preferredFoods: formatList(profile?.preferredFoods),
    dislikedFoods: formatList(profile?.dislikedFoods),
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "프로필 저장에 실패했습니다.");
      return;
    }

    setMessage("프로필을 저장했습니다.");
    onSaved();
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeader
            title={onboarding ? "기본 정보 입력" : "내 정보"}
            description="권장 칼로리와 탄단지 목표 계산에 필요한 정보입니다."
          />
          {!onboarding ? (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              로그아웃
            </button>
          ) : null}
        </div>

        {userEmail ? <p className="mt-3 text-sm text-zinc-500">{userEmail}</p> : null}

        <form onSubmit={save} className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="나이">
            <input
              type="number"
              value={form.age}
              onChange={(event) => setForm({ ...form, age: Number(event.target.value) })}
              className="input"
            />
          </Field>
          <Field label="성별">
            <select
              value={form.gender}
              onChange={(event) => setForm({ ...form, gender: event.target.value as Gender })}
              className="input"
            >
              {Object.entries(genderLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="키(cm)">
            <input
              type="number"
              value={form.heightCm}
              onChange={(event) => setForm({ ...form, heightCm: Number(event.target.value) })}
              className="input"
            />
          </Field>
          <Field label="몸무게(kg)">
            <input
              type="number"
              value={form.weightKg}
              onChange={(event) => setForm({ ...form, weightKg: Number(event.target.value) })}
              className="input"
            />
          </Field>
          <Field label="활동량">
            <select
              value={form.activityLevel}
              onChange={(event) =>
                setForm({ ...form, activityLevel: event.target.value as ActivityLevel })
              }
              className="input"
            >
              {Object.entries(activityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="목표">
            <select
              value={form.goal}
              onChange={(event) => setForm({ ...form, goal: event.target.value as Goal })}
              className="input"
            >
              {Object.entries(goalLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="알레르기">
            <input
              value={form.allergies}
              onChange={(event) => setForm({ ...form, allergies: event.target.value })}
              className="input"
              placeholder="예: 땅콩, 새우"
            />
          </Field>
          <Field label="질환 여부">
            <input
              value={form.conditions}
              onChange={(event) => setForm({ ...form, conditions: event.target.value })}
              className="input"
              placeholder="예: 당뇨, 고혈압"
            />
          </Field>
          <Field label="선호 음식">
            <input
              value={form.preferredFoods}
              onChange={(event) => setForm({ ...form, preferredFoods: event.target.value })}
              className="input"
              placeholder="예: 닭가슴살, 두부"
            />
          </Field>
          <Field label="비선호 음식">
            <input
              value={form.dislikedFoods}
              onChange={(event) => setForm({ ...form, dislikedFoods: event.target.value })}
              className="input"
              placeholder="예: 버섯, 생선"
            />
          </Field>

          <div className="md:col-span-2">
            {message ? <p className="mb-3 text-sm text-zinc-700">{message}</p> : null}
            <button
              disabled={loading}
              className="h-12 w-full rounded-md bg-zinc-950 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 sm:w-auto sm:px-6"
            >
              {loading ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-zinc-800">
      {label}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function MealLogger({
  dateKey,
  meals,
  onChanged,
}: {
  dateKey: string;
  meals: Meal[];
  onChanged: () => void;
}) {
  const [mealType, setMealType] = useState<MealType>("BREAKFAST");
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [amountGrams, setAmountGrams] = useState(100);
  const [draftItems, setDraftItems] = useState<MealItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState({
    foodName: "",
    amountGrams: 100,
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
  });

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      const response = await fetch(`/api/foods?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      }).catch(() => null);

      if (response?.ok) {
        const data = await response.json();
        setFoods(data.foods);
      }
    }, 150);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  function addSelectedFood() {
    if (!selectedFood) return;
    setDraftItems([...draftItems, scaleFood(selectedFood, amountGrams)]);
    setSelectedFood(null);
    setAmountGrams(100);
  }

  function addManualFood() {
    if (!manual.foodName) return;
    setDraftItems([
      ...draftItems,
      {
        foodItemId: null,
        foodName: manual.foodName,
        amountGrams: manual.amountGrams,
        calories: manual.calories,
        carbs: manual.carbs,
        protein: manual.protein,
        fat: manual.fat,
        sodiumMg: 0,
        sugar: 0,
        fiber: 0,
      },
    ]);
    setManual({
      foodName: "",
      amountGrams: 100,
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
    });
  }

  async function saveMeal() {
    setMessage("");

    if (!draftItems.length) {
      setMessage("음식을 1개 이상 추가하세요.");
      return;
    }

    const payload = {
      dateKey,
      mealType,
      note,
      items: draftItems,
    };

    const response = await fetch(editingId ? `/api/meals/${editingId}` : "/api/meals", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "식사 저장에 실패했습니다.");
      return;
    }

    setMessage(editingId ? "식사 기록을 수정했습니다." : "식사 기록을 저장했습니다.");
    setDraftItems([]);
    setEditingId(null);
    setNote("");
    onChanged();
  }

  async function deleteMeal(id: string) {
    const response = await fetch(`/api/meals/${id}`, { method: "DELETE" });

    if (response.ok) {
      onChanged();
    }
  }

  function editMeal(meal: Meal) {
    setEditingId(meal.id);
    setMealType(meal.mealType);
    setNote(meal.note ?? "");
    setDraftItems(meal.items);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const draftTotal = itemTotal(draftItems);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
      <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
        <SectionHeader
          title={editingId ? "식사 기록 수정" : "식사 기록 입력"}
          description="음식 DB에서 찾거나 직접 입력해 한 끼 섭취량을 저장합니다."
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="식사 구분">
            <select
              value={mealType}
              onChange={(event) => setMealType(event.target.value as MealType)}
              className="input"
            >
              {Object.entries(mealLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="메모">
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="input"
              placeholder="예: 운동 후 식사"
            />
          </Field>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium text-zinc-800">
            음식 검색
            <span className="mt-2 flex h-12 items-center gap-2 rounded-md border border-zinc-200 px-3">
              <Search className="h-4 w-4 text-zinc-500" aria-hidden />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 outline-none"
                placeholder="현미밥, 닭가슴살, 계란"
              />
            </span>
          </label>

          <div className="mt-3 max-h-48 overflow-auto rounded-md border border-zinc-100">
            {foods.map((food) => (
              <button
                key={food.id}
                onClick={() => setSelectedFood(food)}
                className={clsx(
                  "flex w-full items-center justify-between gap-3 border-b border-zinc-100 px-3 py-3 text-left text-sm last:border-b-0 hover:bg-zinc-50",
                  selectedFood?.id === food.id && "bg-blue-50",
                )}
              >
                <span>
                  <span className="block font-medium text-zinc-900">{food.name}</span>
                  <span className="text-zinc-500">
                    {food.servingLabel} · {numberFormat(food.calories)}kcal
                  </span>
                </span>
                <Plus className="h-4 w-4 text-zinc-500" aria-hidden />
              </button>
            ))}
            {!foods.length ? (
              <p className="px-3 py-4 text-sm text-zinc-500">검색 결과가 없습니다.</p>
            ) : null}
          </div>

          {selectedFood ? (
            <div className="mt-4 flex flex-col gap-3 rounded-md bg-zinc-50 p-3 sm:flex-row sm:items-end">
              <Field label={`${selectedFood.name} 섭취량(g)`}>
                <input
                  type="number"
                  value={amountGrams}
                  onChange={(event) => setAmountGrams(Number(event.target.value))}
                  className="input"
                />
              </Field>
              <button
                onClick={addSelectedFood}
                className="h-12 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800"
              >
                초안에 추가
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-6 rounded-md border border-dashed border-zinc-300 p-4">
          <p className="text-sm font-semibold text-zinc-900">직접 입력</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <input
              value={manual.foodName}
              onChange={(event) => setManual({ ...manual, foodName: event.target.value })}
              className="input sm:col-span-3"
              placeholder="음식명"
            />
            {(["amountGrams", "calories", "carbs", "protein", "fat"] as const).map((key) => (
              <input
                key={key}
                type="number"
                value={manual[key]}
                onChange={(event) => setManual({ ...manual, [key]: Number(event.target.value) })}
                className="input"
                placeholder={key}
              />
            ))}
          </div>
          <button
            onClick={addManualFood}
            className="mt-3 h-10 rounded-md border border-[var(--line)] px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            직접 입력 추가
          </button>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-zinc-900">저장 전 초안</p>
          <div className="mt-3 space-y-2">
            {draftItems.map((item, index) => (
              <div
                key={`${item.foodName}-${index}`}
                className="flex items-center justify-between gap-3 rounded-md border border-zinc-100 px-3 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-zinc-900">{item.foodName}</p>
                  <p className="text-zinc-500">
                    {numberFormat(item.amountGrams)}g · {numberFormat(item.calories)}kcal · 단백질{" "}
                    {numberFormat(item.protein, 1)}g
                  </p>
                </div>
                <button
                  onClick={() => setDraftItems(draftItems.filter((_, itemIndex) => itemIndex !== index))}
                  className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100"
                  aria-label="초안 음식 삭제"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ))}
            {!draftItems.length ? (
              <p className="rounded-md bg-zinc-50 px-3 py-4 text-sm text-zinc-500">
                아직 추가된 음식이 없습니다.
              </p>
            ) : null}
          </div>

          <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-900">
            초안 합계: {numberFormat(draftTotal.calories)}kcal · 탄수화물{" "}
            {numberFormat(draftTotal.carbs, 1)}g · 단백질 {numberFormat(draftTotal.protein, 1)}g · 지방{" "}
            {numberFormat(draftTotal.fat, 1)}g
          </div>

          {message ? <p className="mt-3 text-sm text-zinc-700">{message}</p> : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={saveMeal}
              className="h-12 rounded-md bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              {editingId ? "수정 저장" : "식사 저장"}
            </button>
            {editingId ? (
              <button
                onClick={() => {
                  setEditingId(null);
                  setDraftItems([]);
                  setNote("");
                }}
                className="h-12 rounded-md border border-[var(--line)] px-5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                수정 취소
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
        <SectionHeader title="오늘 기록" description="저장된 식사를 수정하거나 삭제할 수 있습니다." />
        <div className="mt-5 space-y-3">
          {meals.map((meal) => {
            const total = itemTotal(meal.items);
            return (
              <article key={meal.id} className="rounded-md border border-zinc-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-950">{mealLabels[meal.mealType]}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {numberFormat(total.calories)}kcal · {meal.items.length}개 음식
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => editMeal(meal)}
                      className="rounded-md px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-50"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => void deleteMeal(meal.id)}
                      className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100"
                      aria-label="식사 삭제"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-zinc-600">
                  {meal.items.map((item) => (
                    <li key={item.id ?? item.foodName}>
                      {item.foodName} {numberFormat(item.amountGrams)}g
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
          {!meals.length ? (
            <p className="rounded-md bg-zinc-50 px-3 py-4 text-sm text-zinc-500">
              아직 저장된 식사가 없습니다.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function AnalysisPanel({ summary, onRefresh }: { summary: Summary; onRefresh: () => void }) {
  if (!summary.targets || !summary.totals) {
    return null;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeader
            title="권장량과 실제 섭취량"
            description="목표 범위에서 벗어난 영양소를 우선 조정하세요."
          />
          <button
            onClick={onRefresh}
            className="h-10 rounded-md border border-[var(--line)] px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            다시 분석
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {summary.comparisons.map((comparison) => (
            <div key={comparison.key} className="rounded-md border border-zinc-100 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-semibold text-zinc-950">{comparison.label}</p>
                <span
                  className={clsx(
                    "rounded-full border px-2 py-1 text-xs font-semibold",
                    statusClass(comparison.status),
                  )}
                >
                  {statusText(comparison.status)}
                </span>
              </div>
              <ProgressRow
                label="섭취량"
                actual={comparison.actual}
                target={comparison.target}
                unit={comparison.unit}
              />
              <p className="mt-3 text-sm text-zinc-500">
                차이 {comparison.delta > 0 ? "+" : ""}
                {numberFormat(comparison.delta, comparison.unit === "mg" ? 0 : 1)}
                {comparison.unit}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
        <SectionHeader title="피드백" />
        <div className="mt-4 space-y-2 text-sm leading-6 text-zinc-700">
          {feedbackLines(summary.feedback?.text ?? "분석할 식사 기록이 없습니다.").map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
