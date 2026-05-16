import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getGmailAuthorizationUrl } from "@/lib/api/gmailService";

export async function GET() {
  const state = randomBytes(24).toString("hex");
  const authorizationUrl = getGmailAuthorizationUrl(state);
  if (!authorizationUrl) {
    return NextResponse.redirect(new URL("/imports?gmail=missing-config", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set("gmail_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
