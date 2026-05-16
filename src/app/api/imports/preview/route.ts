import { NextResponse } from "next/server";
import { getGmailConnectionStatus } from "@/lib/api/gmailService";
import { parseManyTravelEmails, type RawEmailForImport } from "@/lib/imports/travelEmailParser";

export async function GET() {
  return NextResponse.json(await getGmailConnectionStatus());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const emails = normalizeInput(body);
  const parsed = parseManyTravelEmails(emails);
  return NextResponse.json({ ok: true, data: parsed });
}

function normalizeInput(body: Record<string, unknown>): RawEmailForImport[] {
  if (Array.isArray(body.emails)) {
    const emails: RawEmailForImport[] = [];
    body.emails
      .map((email) => {
        if (!email || typeof email !== "object") return null;
        const value = email as Record<string, unknown>;
        return {
          id: typeof value.id === "string" ? value.id : undefined,
          threadId: typeof value.threadId === "string" ? value.threadId : undefined,
          from: typeof value.from === "string" ? value.from : undefined,
          subject: typeof value.subject === "string" ? value.subject : undefined,
          body: typeof value.body === "string" ? value.body : "",
        };
      })
      .forEach((email) => {
        if (email?.body) emails.push(email);
      });
    return emails;
  }

  const bodyText = typeof body.body === "string" ? body.body : "";
  const from = typeof body.from === "string" ? body.from : undefined;
  const subject = typeof body.subject === "string" ? body.subject : undefined;
  const id = typeof body.id === "string" ? body.id : undefined;
  const threadId = typeof body.threadId === "string" ? body.threadId : undefined;
  if (!bodyText) return [];
  return [{ id, threadId, from, subject, body: bodyText }];
}
