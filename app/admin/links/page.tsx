import { getLearningAreaLinks } from "@/lib/links";
import AdminSheetLinkManager from "@/components/AdminSheetLinkManager";

export default async function AdminLinksPage() {
  const initialLinks = await getLearningAreaLinks();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-blue-700 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            🧭 Admin Dashboard
          </h1>
          <nav className="flex gap-6 text-blue-100 text-sm font-medium">
            <a
              href="/students"
              className="hover:text-white transition-colors duration-150"
            >
              Home
            </a>
            <a
              href="/admin/links"
              className="text-white font-semibold border-b-2 border-white"
            >
              Sheet Links
            </a>
            <a
              href="/admin/reports"
              className="hover:text-white transition-colors duration-150"
            >
              Reports
            </a>
          </nav>
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl shadow-md border border-blue-100 p-8">
          <div className="mb-8 border-b border-blue-100 pb-4">
            <h2 className="text-3xl font-semibold text-blue-800">
              Learning Area Sheet Links
            </h2>
            <p className="text-blue-600 text-sm mt-1">
              Manage and verify links for each learning area’s Google Sheet tab.
            </p>
          </div>

          <AdminSheetLinkManager initialLinks={initialLinks} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-200 bg-blue-50 text-blue-700 text-sm py-4 mt-8">
        <div className="max-w-6xl mx-auto px-6 flex justify-between">
          <p>© {new Date().getFullYear()} SmartSchool Admin</p>
          <p className="text-blue-500">
            Built with ❤️ dev Nyamunga
          </p>
        </div>
      </footer>
    </div>
  );
}
