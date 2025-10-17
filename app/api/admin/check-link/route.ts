// app/api/admin/check-link/route.ts
import { extractSheetInfo } from "@/lib/parsing";

export async function POST(req: Request) {
  try {
    const { url, learningArea } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing URL" }),
        { status: 400 }
      );
    }

    console.log(`🔍 Checking sheet for learningArea="${learningArea}" URL="${url}"`);

    const info = await extractSheetInfo(url, learningArea, true);

    // 🧩 Always log what was returned
    console.log("🧩 extractSheetInfo returned:", {
      sheetId: info.sheetId,
      gid: info.gid,
      sheetName: info.sheetName,
      availableTabs: info.availableTabs?.length ? info.availableTabs : "(none)",
    });

    // ✅ If availableTabs exist, log them explicitly for clarity
    if (info.availableTabs?.length) {
      console.log(
        `📋 Available tabs for ${learningArea || "unknown"}:`,
        info.availableTabs
      );
    }

    // ✅ Case 1: Found direct sheet name
    if (info.sheetName) {
      console.log(`✅ Resolved sheetName: ${info.sheetName}`);
      return new Response(
        JSON.stringify({ ok: true, sheetName: info.sheetName }),
        { status: 200 }
      );
    }

    // ✅ Case 2: Needs user to select from available tabs
    if (info.availableTabs?.length) {
      console.log(`📑 Returning ${info.availableTabs.length} available tabs`);
      return new Response(
        JSON.stringify({ ok: false, tabs: info.availableTabs }),
        { status: 200 }
      );
    }

    console.warn("⚠️ No tab info found for this URL");
    return new Response(
      JSON.stringify({ ok: false, error: "No tab info found" }),
      { status: 404 }
    );

  } catch (err: any) {
    console.error("❌ check-link error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500 }
    );
  }
}
