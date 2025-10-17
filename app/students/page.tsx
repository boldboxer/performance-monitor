"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Learner } from "@/lib/types";

interface LoadResponse {
  learnersByAdm: Record<string, Learner[]>;
}

const ITEMS_PER_PAGE = 10;

export default function StudentsPage() {
  const { data, isLoading } = useQuery<LoadResponse>({
    queryKey: ["learners"],
    queryFn: async () => {
      const res = await fetch("/api/load-learning-areas");
      return res.json();
    },
  });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const learners = data?.learnersByAdm ?? {};
  const filtered = Object.entries(learners).filter(([adm, learnerList]) => {
    const name = learnerList?.[0]?.name ?? "";
    return name.toLowerCase().includes(search.toLowerCase()) || adm.includes(search);
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (isLoading) return <p className="text-gray-500">Loading learners…</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-blue-700">Students Directory</h1>

      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search by name or admission number"
        className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white border-blue-200"
      />

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {paginated.map(([adm, learnerList]) => {
          const learner = learnerList[0];
          return (
            <li
              key={adm}
              className="p-4 rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-blue-500 bg-white"
            >
              <Link href={`/students/${adm}`} className="block text-lg font-semibold text-blue-700 hover:underline">
                {learner.name} — {adm}
              </Link>
              <span className="text-sm text-gray-500">{learner.grade ? `Grade: ${learner.grade}` : ""}</span>
            </li>
          );
        })}
      </ul>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-blue-400 rounded hover:bg-blue-800 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-gray-600">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded bg-blue-400 hover:bg-blue-800 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
    </div>
  );
}
