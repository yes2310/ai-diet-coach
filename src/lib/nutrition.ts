import type { ActivityLevel, Gender, Goal, MealItem, Profile } from "@prisma/client";

export type MacroKey = "carbs" | "protein" | "fat";

export type NutritionTotals = {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sodiumMg: number;
  sugar: number;
  fiber: number;
};

export type NutritionTargets = NutritionTotals & {
  bmr: number;
  tdee: number;
  calorieAdjustment: number;
  macroRatios: Record<MacroKey, number>;
};

export type ComparisonStatus = "LOW" | "OK" | "HIGH";

export type NutrientComparison = {
  key: keyof NutritionTotals;
  label: string;
  target: number;
  actual: number;
  unit: string;
  status: ComparisonStatus;
  delta: number;
};

const activityMultipliers: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
};

const macroRatiosByGoal: Record<Goal, Record<MacroKey, number>> = {
  LOSS: { carbs: 0.4, protein: 0.35, fat: 0.25 },
  MAINTAIN: { carbs: 0.5, protein: 0.25, fat: 0.25 },
  GAIN: { carbs: 0.55, protein: 0.25, fat: 0.2 },
  MUSCLE: { carbs: 0.45, protein: 0.3, fat: 0.25 },
};

const calorieAdjustmentByGoal: Record<Goal, number> = {
  LOSS: -400,
  MAINTAIN: 0,
  GAIN: 400,
  MUSCLE: 250,
};

const emptyTotals: NutritionTotals = {
  calories: 0,
  carbs: 0,
  protein: 0,
  fat: 0,
  sodiumMg: 0,
  sugar: 0,
  fiber: 0,
};

export function round(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function calculateBmr(input: {
  gender: Gender;
  weightKg: number;
  heightCm: number;
  age: number;
}) {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;

  if (input.gender === "MALE") {
    return round(base + 5);
  }

  if (input.gender === "FEMALE") {
    return round(base - 161);
  }

  return round(base - 78);
}

export function calculateTargets(profile: Pick<
  Profile,
  "age" | "gender" | "heightCm" | "weightKg" | "activityLevel" | "goal"
>): NutritionTargets {
  const bmr = calculateBmr(profile);
  const tdee = round(bmr * activityMultipliers[profile.activityLevel]);
  const calorieAdjustment = calorieAdjustmentByGoal[profile.goal];
  const calories = Math.max(1200, round(tdee + calorieAdjustment));
  const macroRatios = macroRatiosByGoal[profile.goal];

  return {
    bmr,
    tdee,
    calorieAdjustment,
    macroRatios,
    calories,
    carbs: round((calories * macroRatios.carbs) / 4),
    protein: round((calories * macroRatios.protein) / 4),
    fat: round((calories * macroRatios.fat) / 9),
    sodiumMg: 2000,
    sugar: round((calories * 0.1) / 4),
    fiber: 25,
  };
}

export function calculateFoodAmount(input: {
  amountGrams: number;
  servingGrams: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sodiumMg?: number;
  sugar?: number;
  fiber?: number;
}): NutritionTotals {
  const ratio = input.amountGrams / input.servingGrams;

  return {
    calories: round(input.calories * ratio),
    carbs: round(input.carbs * ratio, 1),
    protein: round(input.protein * ratio, 1),
    fat: round(input.fat * ratio, 1),
    sodiumMg: round((input.sodiumMg ?? 0) * ratio),
    sugar: round((input.sugar ?? 0) * ratio, 1),
    fiber: round((input.fiber ?? 0) * ratio, 1),
  };
}

export function sumMealItems(items: Array<Pick<
  MealItem,
  "calories" | "carbs" | "protein" | "fat" | "sodiumMg" | "sugar" | "fiber"
>>): NutritionTotals {
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
    { ...emptyTotals },
  );
}

export function compareNutrition(
  targets: NutritionTargets,
  actual: NutritionTotals,
): NutrientComparison[] {
  const specs: Array<{
    key: keyof NutritionTotals;
    label: string;
    unit: string;
    tolerance: number;
  }> = [
    { key: "calories", label: "칼로리", unit: "kcal", tolerance: 0.08 },
    { key: "carbs", label: "탄수화물", unit: "g", tolerance: 0.1 },
    { key: "protein", label: "단백질", unit: "g", tolerance: 0.1 },
    { key: "fat", label: "지방", unit: "g", tolerance: 0.12 },
    { key: "sodiumMg", label: "나트륨", unit: "mg", tolerance: 0.15 },
    { key: "sugar", label: "당류", unit: "g", tolerance: 0.15 },
    { key: "fiber", label: "식이섬유", unit: "g", tolerance: 0.15 },
  ];

  return specs.map((spec) => {
    const target = targets[spec.key];
    const current = actual[spec.key];
    const lowLimit = target * (1 - spec.tolerance);
    const highLimit = target * (1 + spec.tolerance);
    const status: ComparisonStatus =
      current < lowLimit ? "LOW" : current > highLimit ? "HIGH" : "OK";

    return {
      ...spec,
      target: round(target, spec.unit === "mg" ? 0 : 1),
      actual: round(current, spec.unit === "mg" ? 0 : 1),
      status,
      delta: round(current - target, spec.unit === "mg" ? 0 : 1),
    };
  });
}

export function createRuleBasedFeedback(
  comparisons: NutrientComparison[],
  profile?: Pick<Profile, "conditions" | "allergies" | "preferredFoods" | "dislikedFoods"> | null,
) {
  const high = comparisons.filter((item) => item.status === "HIGH");
  const low = comparisons.filter((item) => item.status === "LOW");
  const parts: string[] = [];

  if (!high.length && !low.length) {
    parts.push("오늘 섭취량은 목표 범위에 잘 맞습니다. 남은 식사는 현재 균형을 유지하는 방향이 좋습니다.");
  } else {
    if (high.length) {
      parts.push(`${high.map((item) => item.label).join(", ")} 섭취가 목표보다 높습니다.`);
    }
    if (low.length) {
      parts.push(`${low.map((item) => item.label).join(", ")} 섭취가 목표보다 낮습니다.`);
    }
  }

  const proteinLow = low.some((item) => item.key === "protein");
  const carbHigh = high.some((item) => item.key === "carbs");
  const sodiumHigh = high.some((item) => item.key === "sodiumMg");

  if (proteinLow) {
    parts.push("다음 식사에는 닭가슴살, 두부, 계란, 그릭요거트처럼 단백질 밀도가 높은 음식을 추가하세요.");
  }
  if (carbHigh) {
    parts.push("밥, 빵, 면류는 양을 줄이고 채소와 단백질 비중을 늘리는 편이 좋습니다.");
  }
  if (sodiumHigh) {
    parts.push("국물, 소스, 가공식품은 나트륨을 빠르게 올리므로 저녁에는 싱겁게 조정하세요.");
  }

  if (profile?.conditions.length) {
    parts.push(`질환 정보(${profile.conditions.join(", ")})가 있으므로 앱의 조언은 참고용으로만 보고 의료진 조언을 우선하세요.`);
  }

  if (profile?.allergies.length) {
    parts.push(`알레르기(${profile.allergies.join(", ")}) 식품은 추천과 기록에서 반드시 제외하세요.`);
  }

  return parts.join(" ");
}

export function healthWarnings(profile: Pick<Profile, "age" | "conditions">) {
  const warnings: string[] = [];
  const sensitiveConditions = ["당뇨", "고혈압", "신장", "심장", "임신", "섭식장애"];

  if (profile.age < 19) {
    warnings.push("미성년자는 성장 상태에 따라 필요 열량이 달라질 수 있어 보호자와 전문가 상담이 필요합니다.");
  }

  const matched = profile.conditions.filter((condition) =>
    sensitiveConditions.some((keyword) => condition.includes(keyword)),
  );

  if (matched.length) {
    warnings.push(`${matched.join(", ")} 관련 질환 정보가 있어 식단 변경 전 의료진 상담을 권장합니다.`);
  }

  return warnings;
}
