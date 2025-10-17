import { NextRequest, NextResponse } from "next/server";
import { updateStudentSheets } from "@/lib/parsing";

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    await updateStudentSheets(body.studentAreas, body.links);
    return NextResponse.json({ status: "success" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
