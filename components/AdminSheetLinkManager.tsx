"use client";

import { useState, useEffect } from "react";

interface LinkEntry {
  learningArea: string;
  url: string;
  selectedTab?: string;
  availableTabs?: string[];
  status?: string;
  error?: string;
}

interface Props {
  initialLinks: Record<string, string>;
}

export default function AdminSheetLinkManager({ initialLinks }: Props) {
  const [entries, setEntries] = useState<LinkEntry[]>(() =>
    Object.entries(initialLinks).map(([area, url]) => ({
      learningArea: area,
      url,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [testingAll, setTestingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newEntry, setNewEntry] = useState({ learningArea: "", url: "" });

  // ─── Scroll Handling ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Pagination Logic ──────────────────────────────────────────────────────
  const totalPages = Math.ceil(entries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEntries = entries.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Reset to first page when entries change significantly
  useEffect(() => {
    setCurrentPage(1);
  }, [entries.length]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleUrlChange = (idx: number, newUrl: string) => {
    const copy = [...entries];
    const actualIndex = startIndex + idx;
    copy[actualIndex] = {
      ...copy[actualIndex],
      url: newUrl,
      availableTabs: undefined,
      selectedTab: undefined,
      status: "Idle",
      error: undefined,
    };
    setEntries(copy);
  };

  const handleTabSelect = (idx: number, tab: string) => {
    const copy = [...entries];
    const actualIndex = startIndex + idx;
    copy[actualIndex].selectedTab = tab;
    copy[actualIndex].status = "Selected";
    copy[actualIndex].error = undefined;
    setEntries(copy);
  };

  const handleAddEntry = () => {
    if (newEntry.learningArea.trim() && newEntry.url.trim()) {
      setEntries(prev => [...prev, { ...newEntry }]);
      setNewEntry({ learningArea: "", url: "" });
      setShowAddModal(false);
      showToast("success", "New learning area added successfully!");
    } else {
      showToast("error", "Please fill in both learning area and URL");
    }
  };

  const removeRow = (idx: number) => {
    const actualIndex = startIndex + idx;
    setEntries((prev) => prev.filter((_, i) => i !== actualIndex));
    showToast("success", "Learning area removed successfully!");
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── API Calls ─────────────────────────────────────────────────────────────
  const checkLink = async (idx: number) => {
    const actualIndex = startIndex + idx;
    const entry = entries[actualIndex];
    if (!entry.url) return;

    const copy = [...entries];
    copy[actualIndex].status = "Checking...";
    setEntries(copy);

    try {
      const res = await fetch("/api/admin/check-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: entry.url,
          learningArea: entry.learningArea,
        }),
      });
      const data = await res.json();

      const updated = [...entries];
      if (data.ok) {
        updated[actualIndex] = {
          ...updated[actualIndex],
          selectedTab: data.sheetName,
          availableTabs: undefined,
          status: "Resolved ✅",
          error: undefined,
        };
      } else if (data.tabs) {
        updated[actualIndex] = {
          ...updated[actualIndex],
          availableTabs: data.tabs,
          status: "Choose tab ⛔",
          error: undefined,
        };
      } else {
        updated[actualIndex].error = data.error || "Unknown error";
        updated[actualIndex].status = "Error ❌";
      }
      setEntries(updated);
    } catch (err: any) {
      const updated = [...entries];
      updated[actualIndex].status = "Error ❌";
      updated[actualIndex].error = err.message;
      setEntries(updated);
    }
  };

  const testAllLinks = async () => {
    setTestingAll(true);
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry.url) continue;

      const copy = [...entries];
      copy[i].status = "Checking...";
      setEntries(copy);

      try {
        const res = await fetch("/api/admin/check-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: entry.url,
            learningArea: entry.learningArea,
          }),
        });
        const data = await res.json();

        const updated = [...entries];
        if (data.ok) {
          updated[i] = {
            ...updated[i],
            selectedTab: data.sheetName,
            availableTabs: undefined,
            status: "Resolved ✅",
            error: undefined,
          };
        } else if (data.tabs) {
          updated[i] = {
            ...updated[i],
            availableTabs: data.tabs,
            status: "Choose tab ⛔",
            error: undefined,
          };
        } else {
          updated[i].error = data.error || "Unknown error";
          updated[i].status = "Error ❌";
        }
        setEntries(updated);
      } catch (err: any) {
        const updated = [...entries];
        updated[i].status = "Error ❌";
        updated[i].error = err.message;
        setEntries(updated);
      }
    }
    setTestingAll(false);
    showToast("success", "Finished testing all links");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = entries.map((ent) => ({
        learningArea: ent.learningArea,
        url: ent.url,
        sheetName: ent.selectedTab,
      }));

      const res = await fetch("/api/admin/save-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings: payload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      showToast("success", "Mappings saved successfully!");
    } catch (err: any) {
      showToast("error", `Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto p-6">
          <h1 className="text-3xl font-semibold text-blue-700 mb-4">
            Learning Area Sheet Links
          </h1>

          {/* Stats and Controls */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Total: {entries.length} links • Page {currentPage} of {totalPages}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium px-4 py-2 rounded transition-colors"
              >
                ➕ Add Row
              </button>
              <button
                onClick={() => setEditMode(!editMode)}
                className={`font-medium px-4 py-2 rounded transition-colors ${
                  editMode 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {editMode ? '🔒 Done Editing' : '✏️ Edit Mode'}
              </button>
              <button
                onClick={testAllLinks}
                disabled={testingAll}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded disabled:opacity-50 transition-colors"
              >
                {testingAll ? "Testing All..." : "🔍 Test All Links"}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "💾 Save Mappings"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto p-6 w-full">
        {/* Items Per Page Selector */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
              Show:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, entries.length)} of {entries.length} links
          </div>
        </div>

        {/* Link Cards */}
        <div className="space-y-5">
          {currentEntries.map((ent, idx) => (
            <div
              key={`${ent.learningArea}-${startIndex + idx}`}
              className="bg-white shadow-md rounded-lg p-5 border border-blue-100"
            >
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Learning Area
                  </label>
                  <input
                    type="text"
                    value={ent.learningArea}
                    onChange={(e) => {
                      const copy = [...entries];
                      const actualIndex = startIndex + idx;
                      copy[actualIndex].learningArea = e.target.value;
                      setEntries(copy);
                    }}
                    placeholder="e.g. Mathematics Activities"
                    className="mt-1 w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 bg-white text-gray-900 placeholder-gray-500"
                    style={{ color: '#111827' }}
                    readOnly={!editMode}
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Google Sheet URL
                  </label>
                  <input
                    type="text"
                    value={ent.url}
                    onChange={(e) => handleUrlChange(idx, e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="mt-1 w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 bg-white text-gray-900 placeholder-gray-500"
                    style={{ color: '#111827' }}
                    readOnly={!editMode}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => checkLink(idx)}
                    disabled={!editMode}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Check
                  </button>
                  <button
                    onClick={() => removeRow(idx)}
                    disabled={!editMode}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Status + Errors */}
              <div className="mt-3 text-sm">
                {ent.status && (
                  <div className="text-gray-600">
                    <strong>Status:</strong> {ent.status}
                  </div>
                )}
                {ent.error && <div className="text-red-600">{ent.error}</div>}
              </div>

              {/* Dropdown for available tabs */}
              {ent.availableTabs && ent.availableTabs.length > 0 && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Tab
                  </label>
                  <select
                    value={ent.selectedTab || ""}
                    onChange={(e) => handleTabSelect(idx, e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 bg-white text-gray-900"
                    disabled={!editMode}
                  >
                    <option value="">-- choose a tab --</option>
                    {ent.availableTabs.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Confirm resolved tab */}
              {ent.selectedTab && (
                <div className="mt-2 text-green-700 font-medium">
                  ✅ Resolved tab: <span className="font-semibold">{ent.selectedTab}</span>
                </div>
              )}

              {/* Edit Mode Indicator */}
              {!editMode && (
                <div className="mt-2 text-orange-600 text-sm">
                  🔒 Read-only - Enable edit mode to make changes
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-8 h-8 rounded transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Empty State */}
        {entries.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No learning area links configured. Click "Add Row" to get started.
          </div>
        )}
      </main>

      {/* Sticky Footer */}
      <footer className="sticky bottom-0 z-40 bg-white border-t border-gray-200 py-4">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-600">
          Learning Area Sheet Manager • {entries.length} total links • Page {currentPage} of {totalPages}
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50"
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}

      {/* Add Row Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Add New Learning Area
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Learning Area Name
                </label>
                <input
                  type="text"
                  value={newEntry.learningArea}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, learningArea: e.target.value }))}
                  placeholder="e.g. Mathematics Activities"
                  className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 bg-white text-gray-900"
                  style={{ color: '#111827' }}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Sheet URL
                </label>
                <input
                  type="text"
                  value={newEntry.url}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 bg-white text-gray-900"
                  style={{ color: '#111827' }}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddEntry}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Add Learning Area
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-20 right-6 px-4 py-3 rounded-lg shadow-lg text-white transition-all duration-500 z-50 ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}