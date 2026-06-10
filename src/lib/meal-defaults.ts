export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

const koreaTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  hourCycle: "h23",
});

export function defaultMealTypeForKoreaTime(date = new Date()): MealType {
  const hour = koreaHour(date);

  if (hour >= 5 && hour < 11) {
    return "BREAKFAST";
  }

  if (hour >= 11 && hour < 16) {
    return "LUNCH";
  }

  if (hour >= 17 && hour < 22) {
    return "DINNER";
  }

  return "SNACK";
}

function koreaHour(date: Date) {
  const hourPart = koreaTimeFormatter
    .formatToParts(date)
    .find((part) => part.type === "hour");
  const hour = Number(hourPart?.value);
  return Number.isFinite(hour) ? hour : 0;
}
