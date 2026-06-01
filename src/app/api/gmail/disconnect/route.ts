import { NextResponse } from "next/server";
import { disconnectGmail } from "@/lib/api/gmailService";

export async function GET() {
  await disconnectGmail();
  return NextResponse.redirect(new URL("/imports?gmail=disconnected", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}

export async function POST() {
  await disconnectGmail();
  return NextResponse.json({ ok: true });
}
