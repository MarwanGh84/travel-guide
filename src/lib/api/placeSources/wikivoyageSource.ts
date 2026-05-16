import { DestinationIntelligence, NormalizedPlace } from "@/lib/types/sources";
import { DestinationIntelligenceSchema } from "@/lib/validation/schemas";

type MediaWikiSection = {
  anchor: string;
  level: string;
  number: string;
  toclevel: number;
  line: string;
  index: string;
};

type MediaWikiResponse = {
  parse?: {
    title: string;
    pageid: number;
    sections: MediaWikiSection[];
    text: { "*": string };
  };
};

export async function getWikivoyageIntelligence(destination: string, country: string): Promise<DestinationIntelligence | null> {
  try {
    // 1. Search for the best match
    const searchQuery = destination.length > 2 ? destination : country;
    const searchRes = await fetch(`https://en.wikivoyage.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`);
    const searchData = await searchRes.json();
    let bestMatch = searchData.query?.search?.[0]?.title;

    // Fallback to country if city search yielded no results
    if (!bestMatch && destination !== country) {
      const countryRes = await fetch(`https://en.wikivoyage.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(country)}&format=json&origin=*`);
      const countryData = await countryRes.json();
      bestMatch = countryData.query?.search?.[0]?.title;
    }

    if (!bestMatch) return null;

    // 2. Parse the page
    const parseRes = await fetch(`https://en.wikivoyage.org/w/api.php?action=parse&page=${encodeURIComponent(bestMatch)}&prop=sections|text&format=json&origin=*`);
    const parseData = (await parseRes.json()) as MediaWikiResponse;

    if (!parseData.parse) return null;

    const sections = parseData.parse.sections;
    const fullHtml = parseData.parse.text["*"];

    // 3. Extract meaningful sections
    const neighborhoods = sections.filter(s => /districts|neighborhoods|provinces|regions/i.test(s.line)).map(s => s.line);
    
    // Attempt to get content for Culture and History
    const cultureSection = sections.find(s => /culture|see|do|events/i.test(s.line));
    const historySection = sections.find(s => /history|background|origin/i.test(s.line));

    return DestinationIntelligenceSchema.parse({
      name: destination,
      country,
      overview: extractLeadParagraph(fullHtml) || `Intelligence for ${bestMatch} synthesized.`,
      neighborhoods: neighborhoods.length > 0 ? neighborhoods : ["Old Town", "City Center", "Residential districts"],
      culture: cultureSection ? (await fetchSectionText(bestMatch, cultureSection.index)) ?? undefined : undefined,
      history: historySection ? (await fetchSectionText(bestMatch, historySection.index)) ?? undefined : undefined,
      practicalNotes: ["Source: Wikivoyage", `Target: ${bestMatch}`],
      source: "wikivoyage"
    });
  } catch (error) {
    console.error("Wikivoyage Error:", error);
    return null;
  }
}

async function fetchSectionText(page: string, index: string): Promise<string | null> {
  try {
    const res = await fetch(`https://en.wikivoyage.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&section=${index}&prop=text&format=json&origin=*`);
    const data = await res.json();
    const html = data.parse?.text?.["*"];
    if (!html) return null;
    return cleanHtml(html).slice(0, 500) + "...";
  } catch {
    return null;
  }
}

function extractLeadParagraph(html: string): string | null {
  // Find the first paragraph that isn't empty and doesn't contain coordinates or meta-info
  const paragraphs = html.match(/<p>(.*?)<\/p>/g);
  if (!paragraphs) return null;
  
  for (const p of paragraphs) {
    const text = cleanHtml(p);
    if (text.length > 40 && !text.includes("Coordinates:")) {
      return text.slice(0, 350) + "...";
    }
  }
  return null;
}

function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]*>?/gm, "") // Remove tags
    .replace(/\[\d+\]/g, "")    // Remove citations
    .replace(/\s+/g, " ")       // Normalize whitespace
    .trim();
}

export async function getWikivoyagePOIs(): Promise<NormalizedPlace[]> {
  return [];
}
