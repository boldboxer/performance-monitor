export function normalizeValForUI(val: string): string {
  if (!val) return "";
  val = val.toUpperCase().replace(/[._-]/g, " ").trim();
  const map = ["B E", "A E", "M E", "E E"];
  return map.includes(val) ? val : "";
}

export function normalizeValForSheet(val: string): string {
  if (!val) return "";
  val = val.toUpperCase().replace(/\s/g, "");
  const map: Record<string, string> = {
    BE: "B.E",
    AE: "A.E",
    ME: "M.E",
    EE: "E.E",
  };
  return map[val] ?? val;
}
