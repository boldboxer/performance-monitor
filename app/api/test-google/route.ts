import { NextResponse } from "next/server";
import { testGoogleConnection } from "@/lib/googleSheets";

export async function GET() {
  const result = await testGoogleConnection();
  return NextResponse.json(result);
}
