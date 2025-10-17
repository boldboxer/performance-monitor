// lib/googleClient.ts
import { google } from "googleapis";

/**
 * ✅ Canonical Google Sheets API client.
 * Uses GoogleAuth for service accounts.
 */
let cachedSheets: ReturnType<typeof google.sheets> | null = null;

export async function getSheetsClient() {
  if (cachedSheets) return cachedSheets;

  const clientEmail =
    process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google API credentials. Check env vars.");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });

  cachedSheets = google.sheets({ version: "v4", auth });
  return cachedSheets;
}
