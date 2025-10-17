"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import LearningAreaCard from "@/components/LearningAreaCard";
import { LearningArea } from "@/lib/types";
import { useLearningAreas } from "@/lib/hooks/useLearningAreas";

const LEARNING_AREA_COLORS: Record<string, string> = {
  "Mathematics Activities": "border-blue-500",
  "English Activities": "border-orange-500",
  "Kiswahili Activities": "border-green-500",
  "Creative / Psychomotor Activities": "border-purple-500",
  "Language": "border-yellow-400",
  "Environmental Activities": "border-teal-400",
  "Religious Activities": "border-pink-400",
};

export default function StudentEditPage() {
  const { admNo } = useParams<{ admNo: string }>();
  const { data, isLoading, error, saveUpdates, saving } = useLearningAreas();
  const learnerAreas = data?.learnersByAdm?.[admNo] ?? [];
  const [areas, setAreas] = useState<LearningArea[]>([]);
  const [dryRun, setDryRun] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (learnerAreas.length > 0) setAreas(learnerAreas);
  }, [learnerAreas]);

  const handleSave = async () => {
    if (!data?.links) return;

    try {
      await saveUpdates({ studentAreas: areas, links: data.links, dryRun });
      setToast({ message: dryRun ? "Preview complete (no changes sent)" : "Updates saved successfully!", type: "success" });
    } catch (err: any) {
      console.error(err);
      setToast({ message: "Failed to save updates", type: "error" });
    }
    setTimeout(() => setToast(null), 3000);
  };

  if (isLoading) return <p className="text-gray-500">Loading learner data…</p>;
  if (error) return <p className="text-red-500">Error: {(error as Error).message}</p>;
  if (!learnerAreas.length) return <p className="text-gray-600">No learner found for {admNo}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="p-6 space-y-6 max-w-4xl mx-auto relative">
        <h1 className="text-2xl font-bold text-blue-700">{areas[0]?.name} ({areas[0]?.admissionNo})</h1>

        {/* <label className="flex items-center gap-2">
        <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="accent-blue-500"/>
        Preview mode (dry-run)
      </label> */}

        <div className="space-y-4">
          {areas.map((area, i) => (
            <div key={i} className={`border-l-4 p-4 rounded-lg shadow hover:shadow-lg transition-shadow bg-white ${LEARNING_AREA_COLORS[area.learningArea] ?? "border-gray-300"}`}>
              <LearningAreaCard
                area={area}
                onChange={(updated: LearningArea) => {
                  const copy = [...areas];
                  copy[i] = updated;
                  setAreas(copy);
                }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mt-4"
        >
          {saving ? "Saving..." : dryRun ? "Preview Updates" : "Save All Changes"}
        </button>

        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 px-4 py-2 rounded shadow-lg text-white font-medium transition-opacity ${toast.type === "success" ? "bg-green-500" : "bg-red-500"
              }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}
