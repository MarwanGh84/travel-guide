import { NextResponse } from "next/server";
import { searchTravelEmailsFromGmail } from "@/lib/api/gmailService";
import { parseManyTravelEmails } from "@/lib/imports/travelEmailParser";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query : undefined;
  const maxResults = typeof body.maxResults === "number" ? body.maxResults : 10;

  try {
    const emails = await searchTravelEmailsFromGmail({ query, maxResults });
    const parsed = parseManyTravelEmails(emails);
    return NextResponse.json({ ok: true, data: parsed, scanned: emails.length });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: error instanceof Error ? error.message : "Could not scan Gmail.",
    }, { status: 400 });
  }
}
