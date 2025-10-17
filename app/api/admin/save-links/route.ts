import fs from "fs";
import path from "path";
import { resolveLearningAreaTabs } from "@/lib/links";

interface MappingEntry {
  learningArea: string;
  url: string;
  sheetName: string; // selected tab
}

export async function POST(req: Request) {
  const { mappings } = (await req.json()) as { mappings: MappingEntry[] };
  if (!Array.isArray(mappings)) {
    return new Response(JSON.stringify({ error: "Invalid mappings" }), { status: 400 });
  }

  const linksPath = path.join(process.cwd(), "public", "learning_area_links.json");
  const tabsPath = path.join(process.cwd(), "public", "learning_area_tabs.json");

  // Load existing data (or defaults)
  let links: Record<string, string> = {};
  let tabs = await resolveLearningAreaTabs(true);

  try {
    if (fs.existsSync(linksPath)) {
      const raw = fs.readFileSync(linksPath, "utf8");
      links = JSON.parse(raw);
    }
  } catch {
    links = {};
  }

  // Update both
  for (const m of mappings) {
    links[m.learningArea] = m.url;
    tabs[m.learningArea] = m.sheetName;
  }

  try {
    fs.writeFileSync(linksPath, JSON.stringify(links, null, 2), "utf8");
    fs.writeFileSync(tabsPath, JSON.stringify(tabs, null, 2), "utf8");
  } catch (err: any) {
    console.error("save-links: failed writing JSON", err);
    return new Response(JSON.stringify({ error: "Failed to persist links" }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
