import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

interface Mapping {
  learningArea: string;
  url: string;
  sheetName?: string;
}

export async function POST(req: Request) {
  try {
    const { mappings } = await req.json();

    if (!Array.isArray(mappings)) {
      return NextResponse.json(
        { ok: false, error: "Invalid data format: mappings must be an array" },
        { status: 400 }
      );
    }

    // Construct new JSON object for storage
    const links: Record<
      string,
      { url: string; sheetName?: string }
    > = {};

    for (const m of mappings) {
      if (m.learningArea && m.url) {
        links[m.learningArea] = {
          url: m.url,
          sheetName: m.sheetName || undefined,
        };
      }
    }

    // Save file to /public (or /data if preferred)
    const filePath = path.join(process.cwd(), "public", "learning_area_tabs.json");
    await fs.writeFile(filePath, JSON.stringify(links, null, 2), "utf8");

    console.log("✅ Saved learning_area_tabs.json:", Object.keys(links).length, "entries");

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ save-links error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
