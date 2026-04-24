import { z } from "zod";
import { splitList } from "@/lib/strings";

export const loginSchema = z.object({
  email: z.string().email("올바른 이메일을 입력하세요.").toLowerCase(),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, "닉네임은 2자 이상이어야 합니다.").max(30),
});

export const profileSchema = z.object({
  age: z.coerce.number().int().min(14).max(100),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  heightCm: z.coerce.number().min(120).max(230),
  weightKg: z.coerce.number().min(30).max(250),
  activityLevel: z.enum(["SEDENTARY", "LIGHT", "MODERATE", "ACTIVE"]),
  goal: z.enum(["LOSS", "MAINTAIN", "GAIN", "MUSCLE"]),
  allergies: z.preprocess((value) => splitList(value as string), z.array(z.string())),
  conditions: z.preprocess((value) => splitList(value as string), z.array(z.string())),
  preferredFoods: z.preprocess(
    (value) => splitList(value as string),
    z.array(z.string()),
  ),
  dislikedFoods: z.preprocess(
    (value) => splitList(value as string),
    z.array(z.string()),
  ),
});

export const mealItemInputSchema = z.object({
  foodItemId: z.string().optional().nullable(),
  foodName: z.string().min(1),
  amountGrams: z.coerce.number().min(1).max(5000),
  calories: z.coerce.number().min(0).max(10000).optional(),
  carbs: z.coerce.number().min(0).max(2000).optional(),
  protein: z.coerce.number().min(0).max(2000).optional(),
  fat: z.coerce.number().min(0).max(2000).optional(),
  sodiumMg: z.coerce.number().min(0).max(100000).optional(),
  sugar: z.coerce.number().min(0).max(2000).optional(),
  fiber: z.coerce.number().min(0).max(2000).optional(),
});

export const mealInputSchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  note: z.string().max(500).optional().nullable(),
  items: z.array(mealItemInputSchema).min(1),
});

export const foodPhotoCandidateSchema = z.object({
  name: z.string(),
  estimatedGrams: z.coerce.number().min(1).max(5000),
  confidence: z.coerce.number().min(0).max(1),
  calories: z.coerce.number().min(0).max(10000),
  carbs: z.coerce.number().min(0).max(2000),
  protein: z.coerce.number().min(0).max(2000),
  fat: z.coerce.number().min(0).max(2000),
  note: z.string().optional().default(""),
});

export const foodPhotoAnalysisSchema = z.object({
  candidates: z.array(foodPhotoCandidateSchema).min(1).max(5),
  needsUserConfirmation: z.boolean(),
  question: z.string(),
});
