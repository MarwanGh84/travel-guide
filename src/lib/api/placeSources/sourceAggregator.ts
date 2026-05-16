import { NormalizedPlace, DestinationIntelligence } from "@/lib/types/sources";
import { searchGooglePlaces } from "./googlePlacesSource";
import { searchOSMPlaces } from "./osmSource";
import { getWikivoyageIntelligence } from "./wikivoyageSource";
import { TripDraft } from "@/lib/types/travel";

export async function aggregateIntelligence(trip: TripDraft): Promise<{
  places: NormalizedPlace[];
  intelligence: DestinationIntelligence | null;
}> {
  const destination = trip.destination || trip.destinationCountry || "Unknown Destination";
  const country = trip.destinationCountry || "";
  
  const [googleResults, osmResults, wikiIntelligence] = await Promise.allSettled([
    searchGooglePlaces(`${trip.interests.join(", ")} attractions in ${destination}`),
    searchOSMPlaces(destination),
    getWikivoyageIntelligence(destination, country)
  ]);

  const allPlaces: NormalizedPlace[] = [];
  
  if (googleResults.status === "fulfilled") {
    allPlaces.push(...googleResults.value);
  }
  
  if (osmResults.status === "fulfilled") {
    // Only add OSM places if they don't strongly overlap with Google results by name
    const googleNames = new Set(allPlaces.map(p => p.name.toLowerCase()));
    const uniqueOSM = osmResults.value.filter(p => !googleNames.has(p.name.toLowerCase()));
    allPlaces.push(...uniqueOSM);
  }

  const intelligence = wikiIntelligence.status === "fulfilled" ? wikiIntelligence.value : null;

  // Deduplicate and rank
  const deduped = dedupeNormalized(allPlaces);
  
  return {
    places: deduped.sort((a, b) => (b.hiddenGemScore || 0) - (a.hiddenGemScore || 0)),
    intelligence
  };
}

function dedupeNormalized(places: NormalizedPlace[]): NormalizedPlace[] {
  const seen = new Set<string>();
  return places.filter(p => {
    const key = `${p.name.toLowerCase()}-${p.category.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
