// lib/googleSheet.ts
import { google } from "googleapis";
import { SheetInfo, CellUpdate } from "./types";

export async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });

  return google.sheets({ version: "v4", auth });
}

export async function getSheetData({ sheetId, gid }: SheetInfo) {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
    includeGridData: true,
  });
  // find sheet by gid
  const sheet = response.data.sheets?.find(
    (s) => s.properties?.sheetId?.toString() === gid
  );
  return sheet?.data?.[0]?.rowData ?? [];
}

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
