// lib/sheets.ts
import { getSheetsClient } from "./googleClient";
import { google, sheets_v4 } from "googleapis";
import { extractSheetInfo as extractFromParsing } from "@/lib/parsing";
import { SheetInfo, CellUpdate, ExtractResult } from "./types";


/**
 * Re-export shared sheets client
 */
export { getSheetsClient };


/**
 * Type describing how your learning area links map to Google Sheets.
 * Add all the areas you support, or use an index signature for flexibility.
 */
export interface LearningAreaLinks {
  [learningArea: string]: string;
}

/**
 * Finds the row in a sheet that contains the admissionNo.
 * Returns the row number (1-based) or null if not found.
 */
export async function findRowByAdmissionNo(
  sheets: sheets_v4.Sheets, // proper type for Google Sheets client
  sheetId: string,
  sheetTabName: string,
  admissionNo: string
): Promise<number | null> {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `'${sheetTabName}'!C:C`, // column C contains Admission No
    });

    const values: string[][] = res.data.values ?? [];
    const rowIndex = values.findIndex((row) => row[0] === admissionNo);
    return rowIndex >= 0 ? rowIndex + 1 : null; // convert 0-based index to 1-based sheet row
  } catch (err) {
    console.error(`Failed to find row for admissionNo ${admissionNo}`, err);
    return null;
  }
}


/**
 * Delegate to parsing for unified sheet extraction
 */
export async function extractSheetInfo(
  url: string,
  learningArea?: string,
  useDynamicTabs = false
): Promise<ExtractResult> {
  return extractFromParsing(url, learningArea, useDynamicTabs);
}

/**
 * Read data from a given sheet tab
 */
export async function getSheetData({ sheetId, gid }: SheetInfo) {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
    includeGridData: true,
  });
  const sheet = res.data.sheets?.find(
    (s) => s.properties?.sheetId?.toString() === gid
  );
  return sheet?.data?.[0]?.rowData ?? [];
}

/**
 * Batch update cells
 */
export async function updateCells(
  { sheetId, gid }: SheetInfo,
  updates: CellUpdate[]
) {
  const sheets = await getSheetsClient();
  const requests = updates.map((u) => ({
    updateCells: {
      range: {
        sheetId: Number(gid),
        startRowIndex: u.row - 1,
        endRowIndex: u.row,
        startColumnIndex: u.col - 1,
        endColumnIndex: u.col,
      },
      rows: [{ values: [{ userEnteredValue: { stringValue: u.value } }] }],
      fields: "userEnteredValue",
    },
  }));

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: { requests },
  });
}


/**
 * targetRangeFor
 *
 * Builds a full A1-style range like `F42` (not including sheet name)
 * for a given learning area, strand, sub-strand, and admission number.
 * Handles multiple learning areas, dynamic columns, and special
 * cases for Comment and Total.
 *
 * @param learningArea - e.g., "Mathematics Activities"
 * @param strand - main strand name
 * @param subStrand - optional sub-strand
 * @param admissionNo - student admission number, must map to row
 * @returns A1-style range string (e.g., "F342") or null if invalid
 */
export function targetRangeFor(
  learningArea: string,
  strand: string,
  subStrand: string,
  admissionNo: string
): string | null {
  if (!admissionNo) return null;

  const row = parseInt(admissionNo, 10);
  if (!row || row < 2) return null; // assume row 1 is header

  // Column maps per learning area
  const colMap: Record<string, Record<string, string>> = {
    "Mathematics Activities": {
      "Measurement-Time": "F",
      "Measurement-Money": "G",
      "Measurement-Area": "H",
      "Geometry-Lines": "I",
      "Geometry-Shapes": "J",
      Comment: "K",
      Total: "L",
    },
    "English Activities": {
      "Nouns-Naming": "F",
      "Nouns-Place": "G",
      "Passage-Reading": "H",
      "Passage-Writing": "I",
      "Passage-Other": "J",
      Comment: "K",
      Total: "L",
    },
  };

  const areaColumns = colMap[learningArea];
  if (!areaColumns) return null;

  // Determine key
  let key = "";
  if (strand === "Comment" || strand === "Total") {
    key = strand;
  } else if (subStrand) {
    key = `${strand}-${subStrand}`;
  } else {
    key = strand;
  }

  const col = areaColumns[key];
  if (!col) return null;

  return `${col}${row}`; // e.g., "F342"
}



