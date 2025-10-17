import { getLearningAreaLinks, saveLearningAreaLinks } from "@/lib/links";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const links = await getLearningAreaLinks();
    return new Response(JSON.stringify({ ok: true, links }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mappings = body.mappings as { learningArea: string; url: string; sheetName?: string }[];
    if (!Array.isArray(mappings)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), { status: 400 });
    }

    const linksObj: Record<string, string> = {};
    const tabsObj: Record<string, string> = {};

    for (const m of mappings) {
      linksObj[m.learningArea] = m.url;
      if (m.sheetName) tabsObj[m.learningArea] = m.sheetName;
    }

    await saveLearningAreaLinks(linksObj);

    const tabsPath = path.join(process.cwd(), "public", "learning_area_tabs.json");
    fs.writeFileSync(tabsPath, JSON.stringify(tabsObj, null, 2), "utf-8");

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error("save-links error:", err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 });
  }
}
