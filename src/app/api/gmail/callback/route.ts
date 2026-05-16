import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { exchangeGmailCode } from "@/lib/api/gmailService";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("gmail_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectToImports(request.url, "invalid-state");
  }

  try {
    await exchangeGmailCode(code);
    const response = redirectToImports(request.url, "connected");
    response.cookies.delete("gmail_oauth_state");
    return response;
  } catch (error) {
    console.error("Gmail OAuth callback failed", error);
    return redirectToImports(request.url, "connect-failed");
  }
}

function redirectToImports(requestUrl: string, status: string) {
  const url = new URL("/imports", requestUrl);
  url.searchParams.set("gmail", status);
  return NextResponse.redirect(url);
}
