import { NormalizedPlace } from "@/lib/types/sources";
import { OverpassResponseSchema } from "@/lib/validation/schemas";

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export async function searchOSMPlaces(destination: string): Promise<NormalizedPlace[]> {
  // Use Overpass API to find interesting features in the destination area
  // First, we need to geocode the destination to get a bounding box or center
  try {
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`);
    const geoData = await geoRes.json();
    if (!geoData.length) return [];
    
    const loc = geoData[0];
    const lat = parseFloat(loc.lat);
    const lon = parseFloat(loc.lon);
    const radius = 5000; // 5km

    // Query for viewpoints, parks, historic sites, and hidden gems (amenity=public_bath, etc.)
    const query = `
      [out:json][timeout:25];
      (
        node["tourism"~"viewpoint|museum|artwork|attraction"](around:${radius},${lat},${lon});
        way["tourism"~"viewpoint|museum|artwork|attraction"](around:${radius},${lat},${lon});
        node["historic"~"monument|ruins|castle|archaeological_site"](around:${radius},${lat},${lon});
        node["leisure"~"park|garden|nature_reserve"](around:${radius},${lat},${lon});
        node["amenity"~"place_of_worship|library|theatre|community_centre"](around:${radius},${lat},${lon});
      );
      out body;
      >;
      out skel qt;
    `;

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      next: { revalidate: 60 * 60 * 48 }, // 2 days
    });

    if (!response.ok) return [];
    const data = OverpassResponseSchema.parse(await response.json());

    return data.elements
      .filter(el => el.tags && el.tags.name)
      .map(el => mapOSMPlace(el))
      .filter(p => p.confidenceScore > 0.4);
  } catch (error) {
    console.error("OSM/Overpass Error:", error);
    return [];
  }
}

function mapOSMPlace(element: OverpassElement): NormalizedPlace {
  const tags = element.tags || {};
  const name = tags.name || "Unnamed OSM Place";
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  
  const category = tags.tourism || tags.historic || tags.leisure || tags.amenity || "Local Interest";
  
  // Calculate hidden gem score based on OSM tags
  let hiddenGemScore = 50;
  if (tags.note || tags.description) hiddenGemScore += 10;
  if (tags.wikipedia || tags.wikidata) hiddenGemScore -= 15; // More likely to be famous
  if (/viewpoint|nature|ruins/i.test(category)) hiddenGemScore += 15;

  return {
    source: "osm",
    sourceId: `osm-${element.id}`,
    name,
    category: category.charAt(0).toUpperCase() + category.slice(1).replace("_", " "),
    description: tags.description || tags.note || `A local ${category} discovered via OpenStreetMap data.`,
    address: tags["addr:full"] || tags["addr:street"] || "Local discovery",
    latitude: lat,
    longitude: lon,
    website: tags.website || tags["contact:website"],
    tags: Object.keys(tags),
    confidenceScore: 0.7,
    hiddenGemScore: Math.min(95, Math.max(20, hiddenGemScore)),
    raw: element
  };
}
