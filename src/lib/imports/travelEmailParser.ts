export type ParsedTravelEmail = {
  sourceId?: string;
  provider: "Booking.com" | "Expedia" | "Unknown";
  bookingType: "Hotel" | "Flight" | "Tour" | "Car rental" | "Restaurant" | "Travel";
  title: string;
  confirmationNumber?: string;
  startDate?: string;
  endDate?: string;
  address?: string;
  link?: string;
  price?: string;
  guestName?: string;
  cancellationNotes?: string;
  sourceSubject?: string;
  sourceFrom?: string;
  importFingerprint: string;
  confidenceScore: number;
  rawSnippet: string;
};

export type RawEmailForImport = {
  id?: string;
  threadId?: string;
  from?: string;
  subject?: string;
  body: string;
};

const confirmationPatterns = [
  /confirmation(?: number| no\.?| #)?[ \t:#-]+([A-Z0-9-]{5,})/i,
  /booking(?: number| reference| id)?[ \t:#-]+([A-Z0-9-]{5,})/i,
  /itinerary(?: number| #)?[ \t:#-]+([A-Z0-9-]{5,})/i,
  /reservation(?: number| code)?[ \t:#-]+([A-Z0-9-]{5,})/i,
  /expedia(?: group)? itinerary(?:\s+number)?[ \t:#-]+([0-9]{10,})/i,
  /booking\.com\s+confirmation\s+([0-9]{10,})/i,
];

const datePatterns = [
  /(?:check-?in|arrival|depart(?:ure)?|from)[ \t:]+([A-Z][a-z]{2,9}\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/i,
  /(?:check-?out|return|to)[ \t:]+([A-Z][a-z]{2,9}\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/i,
];

export function parseTravelEmail(email: RawEmailForImport): ParsedTravelEmail {
  const text = normalizeText(`${email.subject ?? ""}\n${email.body}`);
  const provider = detectProvider(text, email.from);
  const bookingType = detectBookingType(text);
  const title = detectTitle(text, provider, bookingType);
  const confirmationNumber = firstMatch(text, confirmationPatterns);
  const dates = extractDates(text);
  const address = extractAddress(text);
  const link = extractLink(email.body);
  const price = firstMatch(text, [/(?:total|price|amount|paid)\s*:?\s*((?:USD|AED|EUR|GBP|\$|€|£)\s?[0-9,]+(?:\.\d{2})?)/i]);
  const guestName = firstMatch(text, [/(?:guest|traveler|passenger)[ \t:]+([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+){0,3})/i]);
  const cancellationNotes = extractCancellation(text);
  const importFingerprint = buildImportFingerprint({ email, provider, bookingType, title, confirmationNumber, dates });

  return {
    sourceId: email.id,
    provider,
    bookingType,
    title,
    confirmationNumber,
    startDate: dates[0],
    endDate: dates[1],
    address,
    link,
    price,
    guestName,
    cancellationNotes,
    sourceSubject: email.subject,
    sourceFrom: email.from,
    importFingerprint,
    confidenceScore: scoreParse({ provider, title, confirmationNumber, dates, address, link }),
    rawSnippet: text.slice(0, 900),
  };
}

export function parseManyTravelEmails(emails: RawEmailForImport[]) {
  return emails.map(parseTravelEmail).sort((a, b) => b.confidenceScore - a.confidenceScore);
}

function detectProvider(text: string, from?: string): ParsedTravelEmail["provider"] {
  const source = `${from ?? ""} ${text}`.toLowerCase();
  if (source.includes("booking.com")) return "Booking.com";
  if (source.includes("expedia")) return "Expedia";
  return "Unknown";
}

function detectBookingType(text: string): ParsedTravelEmail["bookingType"] {
  if (/flight|airline|airport|departing|return flight/i.test(text)) return "Flight";
  if (/hotel|property|room|check-?in|check-?out|accommodation/i.test(text)) return "Hotel";
  if (/tour|activity|experience|ticket/i.test(text)) return "Tour";
  if (/car rental|rental car|pickup location/i.test(text)) return "Car rental";
  if (/restaurant|reservation time|table for/i.test(text)) return "Restaurant";
  return "Travel";
}

function detectTitle(text: string, provider: ParsedTravelEmail["provider"], bookingType: ParsedTravelEmail["bookingType"]) {
  const hotel = firstMatch(text, [
    /(?:booking at|reservation at|booked at|stay at)\s+([A-Z0-9][^\n]{3,100}?)(?:\s+(?:is|has been|was)\s+(?:confirmed|now confirmed|ready)|[.!?\n]|$)/i,
    /(?:hotel|property|accommodation)\s+name[ \t:]+([A-Z0-9][^\n]{3,100})/i,
    /(?:property|hotel|accommodation)[ \t:]+([A-Z0-9][^\n]{3,80})/i,
    /(?:you(?:'|’)re booked at|booking at|reservation at)\s+([A-Z0-9][^\n]{3,80})/i,
    /([A-Z0-9][^\n]{3,80})\s+(?:is\s+confirmed|confirmation|reservation)/i,
  ]);
  if (hotel) return cleanTitle(hotel);

  const subjectTitle = firstMatch(text, [
    /(?:booking|reservation)\s+(?:at|for)\s+([A-Z0-9][^\n]{3,100}?)(?:\s+(?:is|has been|was)\s+(?:confirmed|now confirmed|ready)|[.!?\n]|$)/i,
    /(?:confirmed|confirmation|itinerary|reservation)[^\n:]*:\s*([A-Z0-9][^\n]{3,80})/i,
  ]);
  if (subjectTitle) return cleanTitle(subjectTitle);

  return `${provider === "Unknown" ? "" : `${provider} `}${bookingType} booking`.trim();
}

function extractDates(text: string) {
  const dates = datePatterns
    .map((pattern) => firstMatch(text, [pattern]))
    .filter((date): date is string => Boolean(date))
    .map(toIsoDate)
    .filter((date): date is string => Boolean(date));

  const genericDates = [...text.matchAll(/\b([A-Z][a-z]{2,9}\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})\b/g)]
    .map((match) => toIsoDate(match[1]))
    .filter((date): date is string => Boolean(date));

  return [...new Set([...dates, ...genericDates])].slice(0, 2);
}

function extractAddress(text: string) {
  return firstMatch(text, [
    /(?:address|location)\s*:?\s*([^\n]{8,140})/i,
    /\b([0-9]{1,5}\s+[A-Za-z0-9 .,'-]{8,100}(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Boulevard|Blvd)[^\n]*)/i,
  ]);
}

function extractLink(body: string) {
  return body.match(/https?:\/\/[^\s<>"']+/i)?.[0];
}

function extractCancellation(text: string) {
  return firstMatch(text, [
    /(free cancellation[^\n.]{0,140})/i,
    /(non-?refundable[^\n.]{0,140})/i,
    /(cancel(?:lation)? policy[^\n.]{0,160})/i,
  ]);
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)?.[1]?.trim();
    if (match) return cleanTitle(match);
  }
  return undefined;
}

function scoreParse(value: {
  provider: ParsedTravelEmail["provider"];
  title: string;
  confirmationNumber?: string;
  dates: string[];
  address?: string;
  link?: string;
}) {
  let score = 30;
  if (value.provider !== "Unknown") score += 20;
  if (value.title && !/booking$/i.test(value.title)) score += 15;
  if (value.confirmationNumber) score += 15;
  if (value.dates.length) score += 10;
  if (value.address) score += 5;
  if (value.link) score += 5;
  return Math.min(95, score);
}

function normalizeText(value: string) {
  return value.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function cleanTitle(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^(?:your\s+)?(?:booking\.com|expedia)?\s*(?:booking|reservation|itinerary|confirmation)(?:\s+confirmation)?\s*:\s*/i, "")
    .replace(/\s+(?:is|has been|was)\s+(?:confirmed|now confirmed|ready).*$/i, "")
    .replace(/\s+is now$/i, "")
    .replace(/[|•].*$/, "")
    .trim()
    .slice(0, 110);
}

function buildImportFingerprint(value: {
  email: RawEmailForImport;
  provider: ParsedTravelEmail["provider"];
  bookingType: ParsedTravelEmail["bookingType"];
  title: string;
  confirmationNumber?: string;
  dates: string[];
}) {
  const base = [
    value.provider,
    value.bookingType,
    value.confirmationNumber || value.email.id || value.email.subject || value.title,
    value.dates.join(":"),
  ].join("|");
  return normalizeFingerprint(base);
}

function normalizeFingerprint(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9|:-]+/g, "-").replace(/-+/g, "-").slice(0, 180);
}

function toIsoDate(value: string) {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return value;

  const slash = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const month = slash[1].padStart(2, "0");
    const day = slash[2].padStart(2, "0");
    const year = slash[3].length === 2 ? `20${slash[3]}` : slash[3];
    return `${year}-${month}-${day}`;
  }

  const named = value.match(/^([A-Z][a-z]{2,9})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (!named) return undefined;
  const month = monthNumber(named[1]);
  if (!month) return undefined;
  return `${named[3]}-${month}-${named[2].padStart(2, "0")}`;
}

function monthNumber(month: string) {
  const index = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"].indexOf(month.toLowerCase());
  return index >= 0 ? String(index + 1).padStart(2, "0") : undefined;
}
