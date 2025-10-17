import { getSheetsClient, extractSheetInfo, targetRangeFor, findRowByAdmissionNo } from "@/lib/sheets";
import { normalizeValForSheet } from "@/lib/utils/normalizeScores";
import { getLearningAreaLinks, resolveLearningAreaTabs  } from "@/lib/links";
import { LearningArea } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { updates } = (await req.json()) as { updates: LearningArea[] };

    if (!Array.isArray(updates) || updates.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid or empty updates array" }),
        { status: 400 }
      );
    }

    const links = await getLearningAreaLinks();
    const tabs = await resolveLearningAreaTabs(true);
    const sheets = await getSheetsClient();

    for (const area of updates) {
      const link = links[area.learningArea];
      if (!link) {
        console.warn(`No link found for learningArea: ${area.learningArea}`);
        continue;
      }

      // ✅ Properly await extractSheetInfo()
      const extractRes = await extractSheetInfo(link, area.learningArea);

      // ✅ Handle fallback (no gid, ambiguous tabs)
      if ("availableTabs" in extractRes && extractRes.availableTabs?.length) {
        console.warn(
          `⚠️ Ambiguous tab for ${area.learningArea}. Found tabs: ${extractRes.availableTabs.join(", ")}`
        );
        // Optionally send this info back in a response for admin UI
        continue;
      }


      const { sheetId, sheetName } = extractRes;
      const sheetTabName = tabs[area.learningArea] ?? sheetName;

      console.log(
        `[SheetTab] Learning area: ${area.learningArea} -> Using tab: '${sheetTabName}'`
      );

      // 🔍 Find the row for this student's admissionNo in column C
      const row = await findRowByAdmissionNo(
        sheets,
        sheetId,
        sheetTabName,
        area.admissionNo ?? ""
      );

      if (!row) {
        console.warn(
          `Could not find row for admissionNo ${area.admissionNo} in ${sheetTabName}`
        );
        continue;
      }

      // --- Update scores ---
      for (const [strand, subScores] of Object.entries(area.scores)) {
        for (const [subStrand, value] of Object.entries(subScores)) {
          const safeValue = normalizeValForSheet(value as string);
          const targetRange = targetRangeFor(
            area.learningArea,
            strand,
            subStrand,
            row.toString()
          );
          if (!targetRange) continue;

          console.log(
            `[TargetRange] ${area.learningArea} - ${strand}-${subStrand} (adm ${area.admissionNo}): ${targetRange}`
          );
          try {
            await sheets.spreadsheets.values.update({
              spreadsheetId: sheetId,
              range: `'${sheetTabName}'!${targetRange}`,
              valueInputOption: "USER_ENTERED",
              requestBody: { values: [[safeValue]] },
            });
          } catch (err) {
            console.error(
              `Failed updating ${strand}-${subStrand} in ${sheetTabName}!${targetRange}:`,
              err
            );
          }
        }
      }

      // --- Update Comment & Total ---
      const commentVal = area.comment?.trim() ?? "";
      const totalVal = normalizeValForSheet(area.total ?? "");

      const commentRange = targetRangeFor(
        area.learningArea,
        "Comment",
        "",
        row.toString()
      );
      const totalRange = targetRangeFor(
        area.learningArea,
        "Total",
        "",
        row.toString()
      );

      if (commentRange) {
        try {
          console.log(`[TargetRange] Comment (adm ${area.admissionNo}): ${commentRange}`);
          await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: `'${sheetTabName}'!${commentRange}`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [[commentVal]] },
          });
        } catch (err) {
          console.error(`Failed updating Comment in ${sheetTabName}!${commentRange}:`, err);
        }
      }

      if (totalRange) {
        try {
          console.log(`[TargetRange] Total (adm ${area.admissionNo}): ${totalRange}`);
          await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: `'${sheetTabName}'!${totalRange}`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [[totalVal]] },
          });
        } catch (err) {
          console.error(`Failed updating Total in ${sheetTabName}!${totalRange}:`, err);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updates.length} entries.`,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error updating learning areas:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal Server Error",
      }),
      { status: 500 }
    );
  }
}
