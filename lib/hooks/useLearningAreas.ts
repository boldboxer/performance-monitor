"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LearningArea, LearningAreaLinks } from "@/lib/types";
import { normalizeValForSheet } from "@/lib/utils/normalizeScores";

interface LoadResponse {
  learnersByAdm: Record<string, LearningArea[]>;
  summary: Record<string, any>;
  links: LearningAreaLinks;
}

export interface UpdatePayload {
  studentAreas: LearningArea[];
  links: LearningAreaLinks;
  dryRun?: boolean;
}

export function useLearningAreas() {
  const queryClient = useQueryClient();

  const { data, error, isLoading } = useQuery<LoadResponse>({
    queryKey: ["learningAreas"],
    queryFn: async () => {
      const res = await fetch("/api/load-learning-areas");
      if (!res.ok) throw new Error("Failed to load learning areas");
      return res.json();
    },
  });

  const mutation = useMutation<void, Error, UpdatePayload>({
    mutationFn: async (payload: UpdatePayload) => {
      // Normalize all scores, totals, and comments
      const updates = payload.studentAreas.map((area) => ({
        ...area,
        total: normalizeValForSheet(area.total ?? ""),
        comment: (area.comment ?? "").trim(),
        scores: Object.fromEntries(
          Object.entries(area.scores).map(([strand, subScores]) => [
            strand,
            Object.fromEntries(
              Object.entries(subScores).map(([sub, val]) => [sub, normalizeValForSheet(val as string)])
            ),
          ])
        ),
      }));

      console.log(payload.dryRun ? "[DryRun] Updates:" : "[Sending] Updates:", JSON.stringify(updates, null, 2));

      if (payload.dryRun) {
        // Preview only
        return;
      }

      const res = await fetch("/api/update-learning-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Failed to save updates");
      }

      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["learningAreas"] });
    },
  });

  return {
    data,
    error,
    isLoading,
    saveUpdates: mutation.mutateAsync,
    saving: mutation.status === "pending",
  };
}
