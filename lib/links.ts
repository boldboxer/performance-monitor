import fs from "fs";
import path from "path";

export type LearningAreaLinks = Record<string, string>;

export interface LearningAreaEntry {
  url: string;
  sheetName?: string;
}

// Paths to both JSON files
const LINKS_JSON_PATH = path.join(process.cwd(), "public", "learning_area_links.json");
const TABS_JSON_PATH = path.join(process.cwd(), "public", "learning_area_tabs.json");

/**
 * ✅ Load the full mapping (URL + sheetName)
 * Combines data from both links and tabs JSON files
 */
export async function getLearningAreaMappings(): Promise<Record<string, LearningAreaEntry>> {
  let links: Record<string, string> = {};
  let tabs: Record<string, string> = {};

  try {
    const rawLinks = fs.readFileSync(LINKS_JSON_PATH, "utf-8");
    links = JSON.parse(rawLinks);
  } catch {}

  try {
    const rawTabs = fs.readFileSync(TABS_JSON_PATH, "utf-8");
    tabs = JSON.parse(rawTabs);
  } catch {}

  const result: Record<string, LearningAreaEntry> = {};
  for (const [area, url] of Object.entries(links)) {
    result[area] = { url, sheetName: tabs[area] || undefined };
  }

  return result;
}

/**
 * ✅ Legacy helper: return only URLs
 */
export async function getLearningAreaLinks(): Promise<LearningAreaLinks> {
  const full = await getLearningAreaMappings();
  const simplified: LearningAreaLinks = {};
  for (const [area, entry] of Object.entries(full)) {
    simplified[area] = entry.url;
  }
  return simplified;
}

/**
 * ✅ Legacy helper: return only tab names
 */
export async function getLearningAreaTabs(): Promise<Record<string, string>> {
  const full = await getLearningAreaMappings();
  const simplified: Record<string, string> = {};
  for (const [area, entry] of Object.entries(full)) {
    if (entry.sheetName) simplified[area] = entry.sheetName;
  }
  return simplified;
}

/**
 * ✅ Unified resolver — merge static + dynamic
 */
export async function resolveLearningAreaTabs(useDynamic = false): Promise<Record<string, string>> {
  const staticTabs: Record<string, string> = {
    "Mathematics Activities": "Sheet7",
    "English Activities": "Sheet8",
  };

  if (!useDynamic) return staticTabs;

  const dynamicTabs = await getLearningAreaTabs();
  return { ...staticTabs, ...dynamicTabs };
}

/**
 * ✅ Save learning area mappings (both URL + sheetName)
 *    Used by admin API when saving link updates
 */
export async function saveLearningAreaLinks(
  mappings: Record<string, LearningAreaEntry | string>
): Promise<void> {
  const dir = path.dirname(LINKS_JSON_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const linksToSave: Record<string, string> = {};
  const tabsToSave: Record<string, string> = {};

  for (const [key, val] of Object.entries(mappings)) {
    if (typeof val === "string") {
      linksToSave[key] = val;
    } else {
      linksToSave[key] = val.url;
      if (val.sheetName) tabsToSave[key] = val.sheetName;
    }
  }

  fs.writeFileSync(LINKS_JSON_PATH, JSON.stringify(linksToSave, null, 2), "utf-8");
  fs.writeFileSync(TABS_JSON_PATH, JSON.stringify(tabsToSave, null, 2), "utf-8");
}
