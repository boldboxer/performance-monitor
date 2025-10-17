export const SCORE_MAP: Record<string, number> = {
  "B E": 1,
  "A E": 2,
  "M E": 3,
  "E E": 4,
};

export function scoreToNum(score: string): number | null {
  const normalized = score?.toUpperCase().replace(/[.\s]/g, "");
  const map: Record<string, number> = { BE: 1, AE: 2, ME: 3, EE: 4 };
  return map[normalized] ?? null;
}

export function numToScore(num: number): string {
  const rounded = Math.round(num);
  const invMap = ["", "B E", "A E", "M E", "E E"];
  return invMap[rounded] ?? "";
}
