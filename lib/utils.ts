// /lib/utils.ts
export function renderScoreBadge(value: string) {
  const color = SCORE_COLORS[value ?? ""] ?? "";
  return (
    <span className={`inline-block px-2 py-0.5 rounded border ${color}`}>
      {value || "--"}
    </span>
  );
}
