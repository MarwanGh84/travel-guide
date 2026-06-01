import type { CommunityRecommendation } from "@/lib/types/travel";

/**
 * Perplexity Sonar performs real-time web search and synthesizes results with
 * citations. Unlike asking a frozen LLM, this returns up-to-date, sourced local
 * recommendations (Reddit threads, recent blogs, local guides) — the kind of
 * genuine hidden-gem intelligence that a Google Places text search cannot give.
 *
 * Requires PERPLEXITY_API_KEY. Without it, returns an empty, clearly-flagged
 * result instead of inventing data.
 */

const PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions";
const MODEL = "sonar";

export type CommunityIntelResult = {
  ok: boolean;
  isMock: boolean;
  note: string;
  data: CommunityRecommendation[];
};

export function isPerplexityConfigured() {
  return Boolean(process.env.PERPLEXITY_API_KEY);
}

type PerplexityResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  citations?: string[];
  search_results?: Array<{ title?: string; url?: string }>;
};

export async function getCommunityRecommendations(
  destination: string,
  focus: "hidden-gems" | "restaurants" = "hidden-gems",
): Promise<CommunityIntelResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return { ok: true, isMock: true, note: "Perplexity not connected.", data: [] };
  }
  if (!destination) {
    return { ok: true, isMock: false, note: "No destination set.", data: [] };
  }

  const year = new Date().getFullYear();
  const prompt =
    focus === "restaurants"
      ? `Find genuinely good local restaurants and food spots in ${destination} that locals recommend and that are NOT tourist traps, based on recent (${year - 1}-${year}) Reddit threads, local food blogs, and local guides. Return 6 places.`
      : `Find real hidden gems and lesser-known local spots in ${destination} that locals recommend and that are NOT in typical guidebooks, based on recent (${year - 1}-${year}) Reddit threads and local blogs. Return 6 spots.`;

  try {
    const response = await fetch(PERPLEXITY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              'You are a local travel expert. Return ONLY valid JSON of the shape {"items":[{"name":string,"category":string,"summary":string}]}. Keep summaries to one or two sentences and specific.',
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      console.error(`Perplexity API Error (${response.status})`);
      return { ok: false, isMock: false, note: `Perplexity error ${response.status}.`, data: [] };
    }

    const result = (await response.json()) as PerplexityResponse;
    const content = result.choices?.[0]?.message?.content ?? "";
    const sources = buildSources(result);
    const items = parseItems(content);

    return {
      ok: true,
      isMock: false,
      note: "Live web search via Perplexity.",
      data: items.map((item, index) => ({
        id: `community-${focus}-${index}`,
        name: item.name,
        category: item.category || (focus === "restaurants" ? "Food" : "Local gem"),
        summary: item.summary,
        sources,
      })),
    };
  } catch (error) {
    console.error("Fetch error while calling Perplexity:", error);
    return { ok: false, isMock: false, note: "Perplexity request failed.", data: [] };
  }
}

function buildSources(result: PerplexityResponse): Array<{ title: string; url: string }> {
  if (Array.isArray(result.search_results) && result.search_results.length > 0) {
    return result.search_results
      .filter((entry): entry is { title?: string; url: string } => Boolean(entry.url))
      .slice(0, 5)
      .map((entry) => ({ title: entry.title || hostname(entry.url), url: entry.url }));
  }
  if (Array.isArray(result.citations)) {
    return result.citations.slice(0, 5).map((url) => ({ title: hostname(url), url }));
  }
  return [];
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function parseItems(content: string): Array<{ name: string; category: string; summary: string }> {
  if (!content) return [];
  try {
    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}");
    const slice = jsonStart >= 0 && jsonEnd > jsonStart ? content.slice(jsonStart, jsonEnd + 1) : content;
    const parsed = JSON.parse(slice) as { items?: Array<{ name?: string; category?: string; summary?: string }> };
    return (parsed.items ?? [])
      .filter((item) => Boolean(item.name))
      .map((item) => ({
        name: String(item.name),
        category: String(item.category ?? ""),
        summary: String(item.summary ?? ""),
      }));
  } catch {
    return [];
  }
}
