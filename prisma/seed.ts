import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const foods = [
  {
    name: "현미밥",
    servingLabel: "100g",
    servingGrams: 100,
    calories: 152,
    carbs: 32,
    protein: 3,
    fat: 1,
    sodiumMg: 2,
    sugar: 0.2,
    fiber: 1.8,
  },
  {
    name: "닭가슴살",
    servingLabel: "100g",
    servingGrams: 100,
    calories: 165,
    carbs: 0,
    protein: 31,
    fat: 3.6,
    sodiumMg: 74,
    sugar: 0,
    fiber: 0,
  },
  {
    name: "계란",
    servingLabel: "1개 50g",
    servingGrams: 50,
    calories: 70,
    carbs: 0.4,
    protein: 6,
    fat: 5,
    sodiumMg: 70,
    sugar: 0.2,
    fiber: 0,
  },
  {
    name: "두부",
    servingLabel: "100g",
    servingGrams: 100,
    calories: 84,
    carbs: 2,
    protein: 9,
    fat: 5,
    sodiumMg: 7,
    sugar: 0.5,
    fiber: 0.4,
  },
  {
    name: "바나나",
    servingLabel: "1개 100g",
    servingGrams: 100,
    calories: 89,
    carbs: 23,
    protein: 1.1,
    fat: 0.3,
    sodiumMg: 1,
    sugar: 12,
    fiber: 2.6,
  },
  {
    name: "고구마",
    servingLabel: "100g",
    servingGrams: 100,
    calories: 128,
    carbs: 30,
    protein: 1.4,
    fat: 0.2,
    sodiumMg: 15,
    sugar: 4.2,
    fiber: 3,
  },
  {
    name: "그릭요거트",
    servingLabel: "100g",
    servingGrams: 100,
    calories: 73,
    carbs: 3.9,
    protein: 10,
    fat: 2,
    sodiumMg: 36,
    sugar: 3.2,
    fiber: 0,
  },
  {
    name: "연어구이",
    servingLabel: "100g",
    servingGrams: 100,
    calories: 206,
    carbs: 0,
    protein: 22,
    fat: 12,
    sodiumMg: 59,
    sugar: 0,
    fiber: 0,
  },
  {
    name: "샐러드",
    servingLabel: "100g",
    servingGrams: 100,
    calories: 35,
    carbs: 6,
    protein: 2,
    fat: 0.5,
    sodiumMg: 25,
    sugar: 2,
    fiber: 2.3,
  },
  {
    name: "흰쌀밥",
    servingLabel: "100g",
    servingGrams: 100,
    calories: 130,
    carbs: 28,
    protein: 2.7,
    fat: 0.3,
    sodiumMg: 1,
    sugar: 0.1,
    fiber: 0.4,
  },
];

async function main() {
  for (const food of foods) {
    await prisma.foodItem.upsert({
      where: { name: food.name },
      update: food,
      create: { ...food, source: "seed" },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
