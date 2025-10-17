// lib/parsing.ts
import { getSheetData, updateCells, getSheetsClient } from "./googleSheets";
import {
  LearningArea,
  LearningAreaLinks,
  SheetInfo,
  StrandScores,
  ExtractResult
} from "./types";
import { normalizeValForSheet } from "./normalization";
import { normalizeValForUI } from "@/lib/utils/normalizeScores";
import { resolveLearningAreaTabs } from "@/lib/links";

// ===============================================================
// HELPERS
// ===============================================================

/**
 * Cache of fetched sheet metadata per spreadsheet ID
 * (so we only call the API once per file)
 */
const sheetMetaCache: Record<
  string,
  { [gid: string]: string } // gid → sheetName
> = {};

/** small normalizer for header text */
function normHeader(s: string | undefined | null): string {
  if (!s && s !== "") return "";
  // convert null/undefined to "", replace NBSP, collapse whitespace, trim
  return String(s)
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ===============================================================
// EXTRACT SHEET INFO (Main Entry Point)
// ===============================================================

/**
 * Extract spreadsheetId and sheetName (tab name) from a Google Sheet URL.
 * - If `gid` exists → resolve tab name via API.
 * - If missing `gid` → check tab mapping (static or dynamic via flag).
 * - If both missing → fetch all tabs and return them as `availableTabs`.
 */
export async function extractSheetInfo(
  url: string,
  learningArea?: string,
  useDynamicTabs = false
): Promise<ExtractResult> {
  if (!url) throw new Error("Empty Google Sheet URL");

  const sheetIdMatch = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const gidMatch = url.match(/gid=(\d+)/);

  if (!sheetIdMatch) throw new Error(`Invalid Google Sheet URL: ${url}`);

  const sheetId = sheetIdMatch[1];
  const gid = gidMatch ? gidMatch[1] : null;
  const sheets = getSheetsClient();

  // --- Case 1: URL includes gid ---
  if (gid) {
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "sheets.properties(sheetId,title)",
    });

    const found = meta.data.sheets?.find(
      (s) => String(s.properties?.sheetId) === gid
    );

    // Graceful handling: if gid invalid, fall through instead of throwing
    if (found?.properties?.title) {
      return { sheetId, gid, sheetName: found.properties.title };
    } else {
      console.warn(`⚠️ GID ${gid} not found in ${sheetId}, falling back to mappings.`);
    }
  }

  // --- Case 2: No valid gid → check mapping (static/dynamic based on flag) ---
  const tabsMap = await resolveLearningAreaTabs(useDynamicTabs);
  if (learningArea && tabsMap[learningArea]) {
    return {
      sheetId,
      gid: "",
      sheetName: tabsMap[learningArea],
    };
  }

  // --- Case 3: No mapping → return all available tabs ---
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
    fields: "sheets.properties(sheetId,title)",
  });

  const availableTabs =
    meta.data.sheets?.map((s) => s.properties?.title || "Untitled") ?? [];

  return {
    sheetId,
    gid: "",
    sheetName: "",
    availableTabs,
  };
}

// ===============================================================
// PARSE LEARNING AREA
// ===============================================================

/**
 * Parse all linked learning areas from Google Sheets.
 * This version builds a robust column map dynamically, and normalizes values for clean dropdown-ready UI.
 */
export async function parseLearningArea(
  links: LearningAreaLinks
): Promise<{
  learnersByAdm: Record<string, LearningArea[]>;
  summary: Record<string, any>;
  links: LearningAreaLinks;
}> {
  const learnersByAdm: Record<string, LearningArea[]> = {};
  const summary: Record<string, any> = {};

  for (const [areaName, url] of Object.entries(links)) {
    // fetch sheet metadata & values
    const sheetInfo = await extractSheetInfo(url, areaName);
    const rows = await getSheetData(sheetInfo);

    // convert google grid-like row data into simple 2D string array
    const values: string[][] = rows.map(
      (r: { values?: { formattedValue?: string | null }[] }) =>
        (r.values ?? []).map((c: { formattedValue?: string | null }) =>
          c.formattedValue == null ? "" : String(c.formattedValue)
        )
    );

    if (values.length < 5) {
      console.warn(`⚠️ ${areaName} sheet too short — skipping`);
      continue;
    }

    // --- Identify header rows according to your layout ---
    // Row 0: strand header row ("Strand" literal at A, actual strand names starting at F)
    // Row 1: sub-strand header row ("Sub-strand" literal at A, actual sub-strand names starting at F)
    // Row 2: meta header row (Term, Year, Admission No, Name, Grade, ..., Comment, Total)
    // Row 3+: data rows
    const strandHeader = values[0] ?? [];
    const subStrandHeader = values[1] ?? [];
    const metaHeader = values[2] ?? [];
    const dataRows = values.slice(3);
    const colCount = Math.max(strandHeader.length, subStrandHeader.length, metaHeader.length);

    // meta columns assumed A..E (0..4) per your layout.
    const metaColsEnd = 4; // 0-based index for Grade
    const scoreStartCol = metaColsEnd + 1; // F => 5 (zero-based)
    const commentCol = Math.max(colCount - 2, scoreStartCol); // last-2
    const totalCol = Math.max(colCount - 1, commentCol + 1);

    // --- Build column map: for every column index -> { strand, sub } ---
    const colMap: { [col: number]: { strand: string; sub: string } | null } = {};
    let lastSeenStrand = "";

    for (let col = 0; col < colCount; col++) {
      const rawStrand = normHeader(strandHeader[col]);
      const rawSub = normHeader(subStrandHeader[col]);

      const isStrandLabel = /^(strand)$/i.test(rawStrand);
      const isSubLabel = /^(sub[\s-]*strand)$/i.test(rawSub);

      if (rawStrand && !isStrandLabel) {
        lastSeenStrand = rawStrand;
      }

      if (col <= metaColsEnd) {
        colMap[col] = null;
        continue;
      }

      if (col >= commentCol) {
        colMap[col] = null;
        continue;
      }

      if (!rawSub && !rawStrand && !lastSeenStrand) {
        colMap[col] = null;
        continue;
      }

      const strandToUse = rawStrand && !isStrandLabel ? rawStrand : lastSeenStrand;
      if (!strandToUse) {
        colMap[col] = null;
        continue;
      }

      const subToUse = !isSubLabel && rawSub ? rawSub : rawSub || "General";

      colMap[col] = { strand: strandToUse, sub: subToUse };
    }

    // --- Parse data rows ---
    for (const row of dataRows) {
      const term = (row[0] ?? "").trim();
      const year = (row[1] ?? "").trim();
      const adm = (row[2] ?? "").trim();
      const name = (row[3] ?? "").trim();
      const grade = (row[4] ?? "").trim();

      if (!adm) continue;

      const scores: StrandScores = {};

      for (let col = scoreStartCol; col < commentCol; col++) {
        const mapping = colMap[col];
        if (!mapping) continue;

        // ✅ Normalize each score for clean dropdown-ready values
        const rawVal = (row[col] ?? "").toString();
        const val = normalizeValForUI(rawVal);

        const { strand, sub } = mapping;
        if (!scores[strand]) scores[strand] = {};
        scores[strand][sub] = val;
      }

      const comment = (row[commentCol] ?? "").toString().trim();
      const total = normalizeValForUI(row[totalCol] ?? "");

      const learner: LearningArea = {
        learningArea: areaName,
        scores,
        comment,
        total,
        name,
        grade,
        admissionNo: adm,
      };

      if (!learnersByAdm[adm]) learnersByAdm[adm] = [];
      learnersByAdm[adm].push(learner);
    }

    summary[areaName] = {
      rows: dataRows.length,
      columns: colCount,
    };
  }

  return { learnersByAdm, summary, links };
}

// ===============================================================
// CHANGE DETECTION
// ===============================================================

function diffScores(
  oldScores: Record<string, Record<string, string>>,
  newScores: Record<string, Record<string, string>>
) {
  const diffs: { strand: string; sub: string; old: string; new: string }[] = [];

  for (const strand in newScores) {
    const newSubs = newScores[strand] || {};
    const oldSubs = oldScores[strand] || {};
    for (const sub in newSubs) {
      const oldVal = oldSubs[sub] ?? "";
      const newVal = newSubs[sub] ?? "";
      if (normalizeValForSheet(oldVal) !== normalizeValForSheet(newVal)) {
        diffs.push({ strand, sub, old: oldVal, new: newVal });
      }
    }
  }
  return diffs;
}

// ===============================================================
// UPDATE TO GOOGLE SHEETS (with fallback handling)
// ===============================================================

/**
 * Update specific learner rows in Google Sheets,
 * matching the strand/sub-strand structure detected by parseLearningArea().
 * If a sheet URL has no gid or mapping, extractSheetInfo() will now
 * gracefully return availableTabs for admin resolution.
 */
export async function updateStudentSheets(
  studentAreas: LearningArea[],
  links: LearningAreaLinks
): Promise<void> {
  for (const area of studentAreas) {
    const link = links[area.learningArea];
    if (!link) {
      console.warn(`⚠️ No Google Sheet link for ${area.learningArea}`);
      continue;
    }

    // ✅ New: Use the enhanced extractSheetInfo()
    const extractRes = await extractSheetInfo(link, area.learningArea);

    // If ambiguous or missing mapping, skip & log available tabs
    if ("availableTabs" in extractRes) {
      console.warn(
        `⚠️ ${area.learningArea} link has no gid or mapping. Available tabs: ${extractRes.availableTabs.join(", ")}`
      );
      // Future: send to admin UI to resolve this mapping
      continue;
    }

    const { sheetId, gid, sheetName } = extractRes;
    const rows = await getSheetData({ sheetId, gid, sheetName });
    const values: string[][] = rows.map(
      (r: { values?: { formattedValue?: string | null }[] }) =>
        (r.values ?? []).map((c: { formattedValue?: string | null }) =>
          c.formattedValue == null ? "" : String(c.formattedValue)
        )
    );

    if (values.length < 4) continue;

    // --- Header structure (same logic as parser) ---
    const strandHeader = values[0] ?? [];
    const subStrandHeader = values[1] ?? [];
    const metaHeader = values[2] ?? [];
    const dataRows = values.slice(3);
    const colCount = Math.max(strandHeader.length, subStrandHeader.length, metaHeader.length);

    const metaColsEnd = 4; // Term, Year, Adm No, Name, Grade
    const scoreStartCol = metaColsEnd + 1;
    const commentCol = Math.max(colCount - 2, scoreStartCol);
    const totalCol = Math.max(colCount - 1, commentCol + 1);

    // --- Build column map like in parser ---
    const colMap: Record<number, { strand: string; sub: string } | null> = {};
    let lastSeenStrand = "";

    for (let col = 0; col < colCount; col++) {
      const rawStrand = normHeader(strandHeader[col]);
      const rawSub = normHeader(subStrandHeader[col]);

      const isStrandLabel = /^(strand)$/i.test(rawStrand);
      const isSubLabel = /^(sub[\s-]*strand)$/i.test(rawSub);
      if (rawStrand && !isStrandLabel) lastSeenStrand = rawStrand;

      if (col <= metaColsEnd || col >= commentCol) {
        colMap[col] = null;
        continue;
      }

      if (!rawSub && !rawStrand && !lastSeenStrand) {
        colMap[col] = null;
        continue;
      }

      const strandToUse = rawStrand && !isStrandLabel ? rawStrand : lastSeenStrand;
      if (!strandToUse) {
        colMap[col] = null;
        continue;
      }

      const subToUse = !isSubLabel && rawSub ? rawSub : (rawSub ? rawSub : "General");
      colMap[col] = { strand: strandToUse, sub: subToUse };
    }

    // --- Find the student's row by Admission No ---
    const studentRowIndex = dataRows.findIndex(
      (r) => (r[2] ?? "").trim() === area.admissionNo
    );
    if (studentRowIndex === -1) {
      console.warn(`⚠️ ${area.admissionNo} not found in ${area.learningArea}`);
      continue;
    }

    const absRow = 3 + studentRowIndex; // because data starts at row 4 (0-based index)

    // --- Build updates ---
    const currentRow = dataRows[studentRowIndex];
    const updates: { row: number; col: number; value: string }[] = [];

    // Scores
    for (let col = scoreStartCol; col < commentCol; col++) {
      const mapping = colMap[col];
      if (!mapping) continue;

      const { strand, sub } = mapping;
      const newVal = area.scores[strand]?.[sub];
      if (newVal == null) continue;

      const oldVal = (currentRow[col] ?? "").trim();
      if (normalizeValForSheet(oldVal) !== normalizeValForSheet(newVal)) {
        updates.push({
          row: absRow + 1, // convert to 1-based for Sheets
          col: col + 1,
          value: normalizeValForSheet(newVal),
        });
      }
    }

    // Comment
    const oldComment = (currentRow[commentCol] ?? "").trim();
    if (
      area.comment &&
      normalizeValForSheet(oldComment) !== normalizeValForSheet(area.comment)
    ) {
      updates.push({
        row: absRow + 1,
        col: commentCol + 1,
        value: area.comment,
      });
    }

    // Total
    const oldTotal = (currentRow[totalCol] ?? "").trim();
    if (
      area.total &&
      normalizeValForSheet(oldTotal) !== normalizeValForSheet(area.total)
    ) {
      updates.push({
        row: absRow + 1,
        col: totalCol + 1,
        value: area.total,
      });
    }

    // --- Push updates to Google Sheets ---
    if (updates.length > 0) {
      console.log(
        `🧩 Updating ${updates.length} cells in ${area.learningArea} for ${area.admissionNo}`
      );
      await updateCells({ sheetId, gid, sheetName }, updates);
    } else {
      console.log(`ℹ️ No changes detected for ${area.learningArea} (${area.admissionNo})`);
    }
  }
}