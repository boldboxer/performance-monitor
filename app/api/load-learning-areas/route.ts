import { NextResponse } from "next/server";
import linksJson from "@/public/learning_area_links.json";
import { parseLearningArea } from "@/lib/parsing";
import type { LearningAreaLinks } from "@/lib/types";

const links = linksJson as LearningAreaLinks;

export async function GET() {
  try {
    const allData = await parseLearningArea(links);
    // ✅ Log fetched data for inspection
    // console.log("[LOAD] Fetched learning area data:", JSON.stringify(allData, null, 2));
    return NextResponse.json(allData);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
