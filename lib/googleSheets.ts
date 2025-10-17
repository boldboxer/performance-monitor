// lib/googleSheets.ts

import { google } from "googleapis";
import { SheetInfo, CellUpdate } from "./types";

/**
 * 🔐 Setup Google Sheets client
 * Expects GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in env
 */
export function getSheetsClient() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error("Missing Google API credentials in environment variables.");
  }
  

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  

  return google.sheets({ version: "v4", auth });  
}

/**
 * Read all data from a Google Sheet tab (3-header format).
 */
export async function getSheetData(sheetInfo: SheetInfo) {
  const sheets = getSheetsClient();

  // ✅ Use the sheet name (not gid) so API range is valid
  const range = `'${sheetInfo.sheetName}'!A1:ZZ1000`;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetInfo.sheetId,
    range,
  });

  const values = res.data.values ?? [];

  // ✅ Convert to "GridData-like" structure expected by the parser
  return values.map((row: any[]) => ({
    values: row.map((v) => ({ formattedValue: v ?? "" })),
  }));
}

/**
 * 🧮 Convert row/column numbers to A1 notation (e.g. row=4, col=2 → "B4")
 */
function toA1(row: number, col: number): string {
  let columnLabel = "";
  let dividend = col;
  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    columnLabel = String.fromCharCode(65 + modulo) + columnLabel;
    dividend = Math.floor((dividend - modulo) / 26);
  }
  return `${columnLabel}${row}`;
}

/**
 * ✏️ Batch update specific cells (used by updateStudentSheets)
 */
export async function updateCells(sheetInfo: SheetInfo, updates: CellUpdate[]) {
  if (!updates.length) return;

  const sheets = getSheetsClient();
  const requests = updates.map((u) => ({
    range: toA1(u.row, u.col),
    values: [[u.value]],
  }));

  const body = {
    valueInputOption: "USER_ENTERED",
    data: requests,
  };

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetInfo.sheetId,
    requestBody: body,
  });

  console.log(`✅ Updated ${updates.length} cells in ${sheetInfo.sheetId}`);
}

/**
 * 🧪 Test helper: verify Google Sheets API connectivity
 * 
 * Call this once (e.g., from /api/test-google or locally) to confirm
 * credentials work and the service account can read/write to Sheets.
 */
export async function testGoogleConnection(sheetId?: string) {
  try {
    const sheets = getSheetsClient();

    // Just fetch spreadsheet metadata if no sheetId is passed
    if (!sheetId) {
      console.log("🔍 Testing Google Sheets API connection...");
      const res = await sheets.spreadsheets.get({
        spreadsheetId: "1YQUq0uIQT1lpw3Hy4bU2xwBxVHSAC8nzGiprWmIoONw", // sample public sheet
      });
      console.log(`✅ Connection OK. Title: ${res.data.properties?.title}`);
      return { ok: true, title: res.data.properties?.title };
    }

    // Otherwise, fetch metadata for your actual sheet
    const res = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    console.log(`✅ Connected to sheet: ${res.data.properties?.title}`);
    return { ok: true, title: res.data.properties?.title };
  } catch (err: any) {
    console.error("❌ Google Sheets connection failed:", err.message);
    return { ok: false, error: err.message };
  }
}
