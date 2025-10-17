"use client";

import React from "react";
import EditableTable from "@/components/EditableTable";
import { LearningArea } from "@/lib/types";
import { DROPDOWN_OPTIONS, SCORE_COLORS } from "@/lib/constants";
import { normalizeValForUI, normalizeValForSheet } from "@/lib/utils/normalizeScores";

interface Props {
  area: LearningArea;
  onChange: (updated: LearningArea) => void;
}

export default function LearningAreaCard({ area, onChange }: Props) {
  const normalizedScores = Object.fromEntries(
    Object.entries(area.scores).map(([strand, subScores]) => [
      strand,
      Object.fromEntries(
        Object.entries(subScores).map(([sub, val]) => [sub, normalizeValForUI(val)])
      ),
    ])
  );

  const handleScoreChange = (updatedScores: typeof normalizedScores) => {
    onChange({ ...area, scores: updatedScores });
  };

  return (
    <div className="border-l-4 border-blue-500 rounded-lg p-4 shadow-md space-y-4 bg-gradient-to-r from-blue-50 via-white to-blue-50 hover:shadow-lg transition-shadow">
      <h2 className="font-bold text-lg text-blue-700">{area.learningArea}</h2>

      <EditableTable
        scores={normalizedScores}
        onChange={handleScoreChange}
        dropdownOptions={DROPDOWN_OPTIONS}
        getScoreColor={(val: string) => SCORE_COLORS[normalizeValForSheet(val)] ?? ""}
      />

      <div className="flex flex-col sm:flex-row gap-3 pt-3">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1 text-blue-600">Comment</label>
          <input
            type="text"
            value={area.comment ?? ""}
            onChange={(e) => onChange({ ...area, comment: e.target.value })}
            className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-400 focus:outline-none text-green-700"
          />
        </div>

        <div className="w-40">
          <label className="block text-sm font-medium mb-1 text-blue-600">Total</label>
          <select
            value={normalizeValForUI(area.total ?? "")}
            onChange={(e) => onChange({ ...area, total: e.target.value })}
            className={`w-full border rounded px-2 py-1 focus:ring-1 focus:ring-blue-400 focus:outline-none ${
              SCORE_COLORS[normalizeValForSheet(area.total ?? "")] ?? ""
            }`}
          >
            {DROPDOWN_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt || "--"}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
