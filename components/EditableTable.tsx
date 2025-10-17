"use client";

import React, { useMemo } from "react";
import { StrandScores } from "@/lib/types";
import { DROPDOWN_OPTIONS, SCORE_COLORS } from "@/lib/constants";
import { normalizeValForUI } from "@/lib/utils/normalizeScores";

export interface EditableTableProps {
  scores: StrandScores;
  onChange: (updated: StrandScores) => void;
  dropdownOptions?: string[];
  getScoreColor?: (val: string) => string;
}

export default function EditableTable({
  scores,
  onChange,
  dropdownOptions = DROPDOWN_OPTIONS,
  getScoreColor = (val) => SCORE_COLORS[val] ?? "",
}: EditableTableProps) {
  const rows = useMemo(() => {
    const result: { strand: string; subStrand: string; value: string }[] = [];
    Object.entries(scores).forEach(([strand, subScores]) => {
      Object.entries(subScores).forEach(([subStrand, rawValue]) => {
        const value = normalizeValForUI(rawValue ?? "");
        result.push({ strand, subStrand, value });
      });
    });
    return result;
  }, [scores]);

  const handleEdit = (strand: string, subStrand: string, newValue: string) => {
    const updated: StrandScores = {
      ...scores,
      [strand]: { ...scores[strand], [subStrand]: newValue },
    };
    onChange(updated);
  };

  return (
    <table className="w-full border border-gray-300 text-sm rounded-lg overflow-hidden">
      <thead className="bg-blue-100 text-blue-700">
        <tr>
          <th className="border px-2 py-1 text-left">Strand</th>
          <th className="border px-2 py-1 text-left">Sub-Strand</th>
          <th className="border px-2 py-1 text-left">Score</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ strand, subStrand, value }) => (
          <tr key={`${strand}-${subStrand}`} className="hover:bg-blue-50 transition-colors">
            <td className="border px-2 py-1 font-medium text-blue-600">{strand}</td>
            <td className="border px-2 py-1 text-gray-700">{subStrand}</td>
            <td className="border px-2 py-1">
              <select
                value={value ?? ""}
                onChange={(e) => handleEdit(strand, subStrand, e.target.value)}
                className={`w-full border rounded px-1 py-1 text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none ${getScoreColor(value ?? "")}`}
              >
                {dropdownOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt || "--"}
                  </option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
