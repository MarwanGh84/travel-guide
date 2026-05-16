export type SourceProvider = "google" | "osm" | "wikivoyage" | "wikidata";

export type NormalizedPlace = {
  source: SourceProvider;
  sourceId: string;
  name: string;
  category: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewCount?: number;
  openingHours?: string[];
  website?: string;
  photoUrl?: string;
  tags?: string[];
  confidenceScore: number;
  hiddenGemScore?: number;
  raw?: unknown;
};

export type DestinationIntelligence = {
  name: string;
  country: string;
  overview?: string;
  neighborhoods?: string[];
  culture?: string;
  history?: string;
  practicalNotes?: string[];
  source: SourceProvider;
};
