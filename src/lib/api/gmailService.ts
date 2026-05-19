import { prisma } from "@/lib/db/prisma";
import { getOrCreateUser } from "@/lib/db/travel";
import type { RawEmailForImport } from "@/lib/imports/travelEmailParser";

const DRIVE_READ_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const GMAIL_SCOPE = `https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email ${DRIVE_READ_SCOPE}`;
const REQUIRED_GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const DEFAULT_SEARCH_QUERY = "newer_than:2y (booking.com OR expedia.com OR 'booking.com' OR 'expedia')";
const DEFAULT_REDIRECT_URI = "http://localhost:3000/api/gmail/callback";

export type GmailConnectionStatus = {
  connected: boolean;
  configured: boolean;
  provider: "gmail";
  email?: string;
  message: string;
  searchQuery: string;
  connectUrl?: string;
};

type GmailListResponse = {
  messages?: { id: string; threadId: string }[];
};

type GmailMessageResponse = {
  id: string;
  threadId?: string;
  snippet?: string;
  payload?: GmailPayloadPart;
};

type GmailPayloadPart = {
  mimeType?: string;
  filename?: string;
  headers?: { name: string; value: string }[];
  body?: { data?: string };
  parts?: GmailPayloadPart[];
};

export function hasGmailOAuthConfig() {
  return Boolean(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET);
}

export async function getGmailConnectionStatus(): Promise<GmailConnectionStatus> {
  const user = await getOrCreateUser();
  const configured = hasGmailOAuthConfig();
  const account = await prisma.connectedAccount.findUnique({
    where: { userId_provider: { userId: user.id, provider: "gmail" } },
  });

  if (account) {
    const hasRequiredScope = account.scope?.split(/\s+/).includes(REQUIRED_GMAIL_SCOPE);
    return {
      connected: Boolean(hasRequiredScope),
      configured,
      provider: "gmail",
      email: account.email ?? undefined,
      searchQuery: DEFAULT_SEARCH_QUERY,
      connectUrl: configured ? "/api/gmail/connect" : undefined,
      message: hasRequiredScope
        ? `Connected to Gmail${account.email ? ` as ${account.email}` : ""}. Scans are read-only and imported only after preview.`
        : "Gmail account is authorized, but Google did not grant the read-only Gmail scope. Update OAuth consent scopes, then reconnect Gmail.",
    };
  }

  return {
    connected: false,
    configured,
    provider: "gmail",
    searchQuery: DEFAULT_SEARCH_QUERY,
    connectUrl: configured ? "/api/gmail/connect" : undefined,
    message: configured
      ? "Gmail OAuth is configured. Connect Gmail to scan Booking.com and Expedia confirmations directly."
      : "Gmail OAuth is not configured yet. Add Gmail OAuth client credentials, then connect Gmail here.",
  };
}

export function getGmailAuthorizationUrl(state: string) {
  if (!hasGmailOAuthConfig()) return null;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GMAIL_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", gmailRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GMAIL_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeGmailCode(code: string) {
  if (!hasGmailOAuthConfig()) throw new Error("Gmail OAuth is not configured.");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GMAIL_CLIENT_ID ?? "",
      client_secret: process.env.GMAIL_CLIENT_SECRET ?? "",
      redirect_uri: gmailRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  const token = await response.json();
  if (!response.ok) {
    throw new Error(token.error_description ?? token.error ?? "Could not connect Gmail.");
  }

  const profile = await fetchGoogleProfile(token.access_token);
  const user = await getOrCreateUser();
  await prisma.connectedAccount.upsert({
    where: { userId_provider: { userId: user.id, provider: "gmail" } },
    update: {
      providerUser: profile.id,
      email: profile.email,
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? undefined,
      scope: token.scope,
      expiresAt: token.expires_in ? new Date(Date.now() + Number(token.expires_in) * 1000) : undefined,
    },
    create: {
      userId: user.id,
      provider: "gmail",
      providerUser: profile.id,
      email: profile.email,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      scope: token.scope,
      expiresAt: token.expires_in ? new Date(Date.now() + Number(token.expires_in) * 1000) : undefined,
    },
  });
}

export function gmailRedirectUri() {
  return process.env.GMAIL_REDIRECT_URI || DEFAULT_REDIRECT_URI;
}

export async function disconnectGmail() {
  const user = await getOrCreateUser();
  await prisma.connectedAccount.deleteMany({ where: { userId: user.id, provider: "gmail" } });
}

export async function searchTravelEmailsFromGmail(options: { query?: string; maxResults?: number } = {}): Promise<RawEmailForImport[]> {
  const token = await getUsableGmailAccessToken();
  const query = options.query?.trim() || DEFAULT_SEARCH_QUERY;
  const maxResults = Math.min(Math.max(options.maxResults ?? 10, 1), 25);
  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listUrl.searchParams.set("q", query);
  listUrl.searchParams.set("maxResults", String(maxResults));

  const list = await gmailFetch<GmailListResponse>(listUrl.toString(), token);
  const messages = list.messages ?? [];
  if (!messages.length) return [];

  return Promise.all(messages.map(async (message) => {
    const detailUrl = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`);
    detailUrl.searchParams.set("format", "full");
    const detail = await gmailFetch<GmailMessageResponse>(detailUrl.toString(), token);
    return toRawEmail(detail);
  }));
}

export async function getUsableGoogleAccessToken(requiredScope = REQUIRED_GMAIL_SCOPE) {
  const user = await getOrCreateUser();
  const account = await prisma.connectedAccount.findUnique({
    where: { userId_provider: { userId: user.id, provider: "gmail" } },
  });
  if (!account) throw new Error("Gmail is not connected.");
  if (!account.scope?.split(/\s+/).includes(requiredScope)) {
    throw new Error(`Google account is connected without the required scope: ${requiredScope}. Reconnect Google.`);
  }
  if (!account.expiresAt || account.expiresAt.getTime() > Date.now() + 60_000) return account.accessToken;
  if (!account.refreshToken) throw new Error("Gmail access expired. Reconnect Gmail.");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID ?? "",
      client_secret: process.env.GMAIL_CLIENT_SECRET ?? "",
      refresh_token: account.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const token = await response.json();
  if (!response.ok) throw new Error(token.error_description ?? token.error ?? "Could not refresh Gmail access.");

  await prisma.connectedAccount.update({
    where: { id: account.id },
    data: {
      accessToken: token.access_token,
      scope: token.scope ?? account.scope,
      expiresAt: token.expires_in ? new Date(Date.now() + Number(token.expires_in) * 1000) : account.expiresAt,
    },
  });
  return token.access_token as string;
}

async function getUsableGmailAccessToken() {
  return getUsableGoogleAccessToken(REQUIRED_GMAIL_SCOPE);
}

export function hasGoogleScope(scope: string, grantedScopes?: string | null) {
  return Boolean(grantedScopes?.split(/\s+/).includes(scope));
}

export { DRIVE_READ_SCOPE };

async function gmailFetch<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? "Gmail request failed.");
  return data as T;
}

async function fetchGoogleProfile(accessToken: string): Promise<{ id?: string; email?: string }> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return {};
  return response.json();
}

function toRawEmail(message: GmailMessageResponse): RawEmailForImport {
  const headers = message.payload?.headers ?? [];
  const subject = headerValue(headers, "subject");
  const from = headerValue(headers, "from");
  const body = extractBody(message.payload) || message.snippet || "";
  return { id: message.id, threadId: message.threadId, from, subject, body };
}

function headerValue(headers: { name: string; value: string }[], name: string) {
  return headers.find((header) => header.name.toLowerCase() === name)?.value;
}

function extractBody(part?: GmailPayloadPart): string {
  if (!part) return "";
  if (part.body?.data && (part.mimeType === "text/plain" || part.mimeType === "text/html")) {
    return decodeBase64Url(part.body.data);
  }
  return (part.parts ?? []).map(extractBody).filter(Boolean).join("\n\n");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8").replace(/<[^>]*>/g, " ");
}
