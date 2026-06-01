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

async function findBestWikivoyagePage(destination: string, country: string): Promise<string | null> {
  try {
    const searchQuery = destination.length > 2 ? destination : country;
    if (!searchQuery) return null;
    
    const url = `https://en.wikivoyage.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`;
    const searchRes = await fetch(url);
    const searchData = await searchRes.json();
    let bestMatch = searchData.query?.search?.[0]?.title;

    // Fallback to country if city search yielded no results
    if (!bestMatch && destination !== country) {
      const countryRes = await fetch(`https://en.wikivoyage.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(country)}&format=json&origin=*`);
      const countryData = await countryRes.json();
      bestMatch = countryData.query?.search?.[0]?.title;
    }
    return bestMatch || null;
  } catch {
    return null;
  }
}

export async function getWikivoyageIntelligence(destination: string, country: string): Promise<DestinationIntelligence | null> {
  try {
    const bestMatch = await findBestWikivoyagePage(destination, country);
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
    
    // Expand practical notes
    const practicalSections = sections.filter(s => /safe|around|health|connect|cope|respect/i.test(s.line));
    const practicalNotes: string[] = [];
    
    for (const s of practicalSections.slice(0, 3)) {
      const text = await fetchSectionText(bestMatch, s.index);
      if (text) practicalNotes.push(`${s.line}: ${text}`);
    }

    return DestinationIntelligenceSchema.parse({
      name: destination,
      country,
      overview: extractLeadParagraph(fullHtml) || `Intelligence for ${bestMatch} synthesized.`,
      neighborhoods: neighborhoods.length > 0 ? neighborhoods : ["Old Town", "City Center", "Residential districts"],
      culture: cultureSection ? (await fetchSectionText(bestMatch, cultureSection.index)) ?? undefined : undefined,
      history: historySection ? (await fetchSectionText(bestMatch, historySection.index)) ?? undefined : undefined,
      practicalNotes: practicalNotes.length > 0 ? practicalNotes : ["Source: Wikivoyage", `Target: ${bestMatch}`],
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
  // Updated regex to support <p> tags with attributes
  const paragraphs = html.match(/<p[^>]*>(.*?)<\/p>/gi);
  if (!paragraphs) return null;
  
  for (const p of paragraphs) {
    const text = cleanHtml(p);
    // Ignore very short paragraphs or ones that look like metadata/coordinates
    if (text.length > 40 && !text.includes("Coordinates:") && !text.includes(".mw-parser-output")) {
      return text.slice(0, 350) + "...";
    }
  }
  return null;
}

function cleanHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") // Remove style blocks and their content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // Remove script blocks and their content
    .replace(/<[^>]*>?/gm, "") // Remove remaining tags
    .replace(/\[edit\]/g, "")   // Remove Wikivoyage [edit] markers
    .replace(/\[\d+\]/g, "")    // Remove citations
    .replace(/\s+/g, " ")       // Normalize whitespace
    .trim();
}

function extractWikiPhoto(html?: string): string | undefined {
  if (!html) return undefined;
  
  // Look for img src in the HTML description
  const match = html.match(/src="([^"]+)"/);
  if (!match) return undefined;
  
  let url = match[1];
  
  // Normalize protocol
  if (url.startsWith("//")) {
    url = `https:${url}`;
  }
  
  // Optimize: Many Wikimedia URLs are thumbnails (e.g., .../thumb/.../300px-File.jpg)
  if (url.includes("/thumb/")) {
    const parts = url.split("/");
    if (parts.length > 3) {
      // Remove the last part (the thumbnail filename) and change /thumb/ back to /
      const originalUrl = url.replace("/thumb/", "/").split("/").slice(0, -1).join("/");
      if (originalUrl.match(/\.(jpg|jpeg|png|webp|svg)$/i)) {
        return originalUrl;
      }
    }
  }
  
  return url;
}

interface WikivoyageFeature {
  type: string;
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    title?: string;
    description?: string;
    symbol?: string;
    group?: string;
  };
  groupKey?: string;
}

export async function getWikivoyagePOIs(destination: string, country: string): Promise<NormalizedPlace[]> {
  try {
    const bestMatch = await findBestWikivoyagePage(destination, country);
    if (!bestMatch) return [];

    const res = await fetch(`https://en.wikivoyage.org/w/api.php?action=query&prop=mapdata&titles=${encodeURIComponent(bestMatch)}&format=json&origin=*`);
    const data = await res.json();
    
    const pages = data.query?.pages;
    if (!pages) return [];
    
    const pageId = Object.keys(pages)[0];
    const mapDataStrings = pages[pageId]?.mapdata;
    if (!mapDataStrings || !Array.isArray(mapDataStrings)) return [];

    const allFeatures: WikivoyageFeature[] = [];
    mapDataStrings.forEach((jsonStr: string) => {
      try {
        const parsed = JSON.parse(jsonStr) as Record<string, unknown[]>;
        // mapdata objects often have keys like 'see', 'eat', 'drink', 'do', 'sleep', 'listing', 'go'
        // each key maps to an array of GeoJSON features
        Object.keys(parsed).forEach(groupKey => {
          const groupFeatures = parsed[groupKey];
          if (Array.isArray(groupFeatures)) {
            groupFeatures.forEach((feature) => {
              const f = feature as WikivoyageFeature;
              if (f.type === "Feature") {
                allFeatures.push({ ...f, groupKey });
              }
            });
          }
        });
      } catch (e) {
        console.error("Error parsing Wikivoyage mapdata JSON string:", e);
      }
    });

    return allFeatures
      .filter(feature => {
        const category = (feature.groupKey || feature.properties?.symbol || "").toLowerCase();
        const title = (feature.properties?.title || "").toLowerCase();
        const description = (feature.properties?.description || "").toLowerCase();
        
        const isStay = category.includes("sleep") || 
                       category.includes("hotel") || 
                       category.includes("hostel") || 
                       title.includes("hotel") || 
                       title.includes("hostel") || 
                       title.includes(" guesthouse") || 
                       title.includes(" bed and breakfast") ||
                       description.includes("hotel") || 
                       description.includes("accommodation");
                       
        return !isStay;
      })
      .map((feature, idx) => {
        const props = feature.properties || {};
        const coords = feature.geometry?.coordinates; // [lon, lat]
        
        const category = feature.groupKey || props.symbol || props.group || "Attraction";
        const cleanCategory = category.charAt(0).toUpperCase() + category.slice(1);
        const photoUrl = extractWikiPhoto(props.description);

        return {
          source: "wikivoyage",
          sourceId: `wiki-${pageId}-${idx}`,
          name: cleanHtml(props.title || "Unknown Wikivoyage Place"),
          category: cleanCategory,
          description: cleanHtml(props.description || `A curated ${category} entry from Wikivoyage.`),
          latitude: coords?.[1],
          longitude: coords?.[0],
          photoUrl,
          confidenceScore: 0.85,
          // Wikivoyage POIs are curated by real travelers and are genuinely
          // lesser-known compared with Google's top tourist results, so they
          // should clear the hidden-gem threshold (75) and surface in the Gems tab.
          hiddenGemScore: 80,
          raw: feature
        };
      });
  } catch (error) {
    console.error("Wikivoyage POIs Error:", error);
    return [];
  }
}
