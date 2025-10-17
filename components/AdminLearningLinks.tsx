"use client";

import React, { useEffect, useState } from "react";

type Mapping = {
  learningArea: string;
  url: string;
  sheetName?: string;
  availableTabs?: string[];
  status?: string;
};

export default function AdminLearningLinks() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/learning-links")
      .then((r) => r.json())
      .then((data) => {
        const links = data?.links ?? {};
        const arr: Mapping[] = Object.entries(links).map(([learningArea, url]) => ({
          learningArea: String(learningArea),
          url: String(url ?? ""),
        }));
        setMappings(arr);
      })
      .catch((err) => {
        console.error("Failed loading links:", err);
        setMessage("Failed to load current links");
      })
      .finally(() => setLoading(false));
  }, []);

  const updateUrl = (index: number, url: string) => {
    const copy = [...mappings];
    copy[index] = { ...copy[index], url, availableTabs: undefined, sheetName: undefined, status: undefined };
    setMappings(copy);
  };

  const addRow = () => {
    setMappings((m) => [...m, { learningArea: "", url: "" }]);
  };

  const removeRow = (i: number) => {
    setMappings((m) => m.filter((_, idx) => idx !== i));
  };

  const checkLink = async (i: number) => {
    const m = mappings[i];
    if (!m.url) return;
    setMappings((arr) => {
      const copy = [...arr];
      copy[i] = { ...copy[i], status: "Checking..." };
      return copy;
    });
    try {
      const res = await fetch("/api/admin/check-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: m.url, learningArea: m.learningArea }),
      });
      const data = await res.json();
      if (data.ok) {
        setMappings((arr) => {
          const copy = [...arr];
          copy[i] = { ...copy[i], sheetName: data.sheetName, availableTabs: undefined, status: "Resolved ✅" };
          return copy;
        });
      } else if (data.tabs) {
        setMappings((arr) => {
          const copy = [...arr];
          copy[i] = { ...copy[i], availableTabs: data.tabs, sheetName: undefined, status: "Select tab" };
          return copy;
        });
      } else {
        setMappings((arr) => {
          const copy = [...arr];
          copy[i] = { ...copy[i], status: `Error: ${data.error ?? "unknown"}` };
          return copy;
        });
      }
    } catch (err: any) {
      console.error(err);
      setMappings((arr) => {
        const copy = [...arr];
        copy[i] = { ...copy[i], status: `Error: ${err.message}` };
        return copy;
      });
    }
  };

  const saveAll = async () => {
    setSaving(true);
    setMessage(null);

    const prepared = mappings.map((m) => ({
      learningArea: m.learningArea || "",
      url: m.url || "",
      sheetName: m.sheetName || undefined,
    }));

    try {
      const res = await fetch("/api/admin/learning-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings: prepared }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage("✅ Saved successfully.");
      } else {
        setMessage(`❌ Save failed: ${data.error ?? "unknown"}`);
      }
    } catch (err: any) {
      setMessage(`❌ Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">📘 Admin Panel — Learning Area Links</h1>

      {loading ? (
        <div className="text-blue-600 text-center py-10 animate-pulse">Loading current mappings…</div>
      ) : (
        <>
          <div className="space-y-6">
            {mappings.map((m, i) => (
              <div
                key={i}
                className="p-6 bg-white border border-blue-100 shadow-md rounded-xl transition-all hover:shadow-lg"
              >
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-blue-700">Learning Area</label>
                    <input
                      className="mt-1 w-full border border-blue-200 focus:border-blue-400 rounded-md px-3 py-2 outline-none"
                      value={m.learningArea}
                      onChange={(e) => {
                        const copy = [...mappings];
                        copy[i] = { ...copy[i], learningArea: e.target.value };
                        setMappings(copy);
                      }}
                      placeholder="e.g. Mathematics Activities"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-blue-700">Sheet URL</label>
                    <input
                      className="mt-1 w-full border border-blue-200 focus:border-blue-400 rounded-md px-3 py-2 outline-none"
                      value={m.url}
                      onChange={(e) => updateUrl(i, e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => checkLink(i)}
                      className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md shadow hover:bg-blue-700 transition-all"
                    >
                      Check
                    </button>
                    <button
                      onClick={() => removeRow(i)}
                      className="px-4 py-2 bg-red-500 text-white font-medium rounded-md shadow hover:bg-red-600 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-4 text-sm">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-white ${
                      m.status?.includes("Error")
                        ? "bg-red-500"
                        : m.status?.includes("Resolved")
                        ? "bg-green-600"
                        : m.status?.includes("Select")
                        ? "bg-yellow-500"
                        : "bg-blue-400"
                    }`}
                  >
                    {m.status ?? "Idle"}
                  </span>

                  {m.sheetName && (
                    <div className="mt-2 text-green-700 font-semibold">
                      ✅ Resolved Tab: <span className="text-green-800">{m.sheetName}</span>
                    </div>
                  )}

                  {m.availableTabs && (
                    <div className="mt-3">
                      <label className="block text-sm font-semibold text-blue-700">Select Tab</label>
                      <select
                        className="mt-1 w-full border border-blue-200 focus:border-blue-400 rounded-md px-3 py-2 outline-none"
                        value={m.sheetName ?? ""}
                        onChange={(e) => {
                          const copy = [...mappings];
                          copy[i] = { ...copy[i], sheetName: e.target.value, status: "Selected ✅" };
                          setMappings(copy);
                        }}
                      >
                        <option value="">-- choose tab --</option>
                        {m.availableTabs.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-4 items-center justify-between border-t pt-6">
            <div className="flex gap-3">
              <button
                onClick={addRow}
                className="px-4 py-2 bg-blue-100 text-blue-800 font-medium rounded-md hover:bg-blue-200 transition-all"
              >
                + Add Row
              </button>
              <button
                onClick={saveAll}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow hover:bg-green-700 transition-all"
              >
                {saving ? "Saving..." : "💾 Save Mappings"}
              </button>
            </div>

            {message && (
              <div
                className={`text-sm font-medium ${
                  message.includes("✅")
                    ? "text-green-700"
                    : message.includes("❌")
                    ? "text-red-600"
                    : "text-blue-600"
                }`}
              >
                {message}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
