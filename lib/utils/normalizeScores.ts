// lib/utils/normalizeScores.ts

export function normalizeValForUI(raw: string | null | undefined): string {
  if (!raw) return "";
  let val = String(raw).trim().toUpperCase();

  // Remove dots, underscores, non-breaking spaces, dashes
  val = val
    .replace(/\./g, "")
    .replace(/\xa0/g, " ")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .trim();
  val = val.replace(/\s+/g, " "); // collapse spaces

  const mapping: Record<string, string> = {
    "B E": "B E",
    "A E": "A E",
    "M E": "M E",
    "E E": "E E",
  };

  if (mapping[val]) return mapping[val];

  const valNoSpace = val.replace(/\s+/g, "");
  for (const key in mapping) {
    if (valNoSpace === key.replace(/\s+/g, "")) {
      return mapping[key];
    }
  }

  // Handle N/A or blank placeholders
  if (["N/A", "NA", "--", "-", "NONE"].includes(val)) return "";

  return "";
}

export function normalizeValForSheet(val: string | null | undefined): string {
  if (!val) return "";
  const upper = val.toUpperCase().replace(/[\s._-]+/g, "");
  const mapping: Record<string, string> = {
    BE: "B.E",
    AE: "A.E",
    ME: "M.E",
    EE: "E.E",
  };
  return mapping[upper] || val;
}
