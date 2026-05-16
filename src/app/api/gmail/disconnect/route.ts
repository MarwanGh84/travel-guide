import { NextResponse } from "next/server";
import { disconnectGmail } from "@/lib/api/gmailService";

export async function POST() {
  await disconnectGmail();
  return NextResponse.json({ ok: true });
}
