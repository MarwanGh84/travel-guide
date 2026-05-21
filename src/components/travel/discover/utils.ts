export function formatProvider(provider?: string) {
  switch (provider) {
    case "google":
    case "google-places":
      return "Google";
    case "osm":
      return "OSM";
    case "wikivoyage":
      return "Wiki";
    case "wikidata":
      return "Data";
    case "openai":
      return "AI";
    default:
      return provider || "Source";
  }
}

export function getProviderStyles(provider?: string) {
  switch (provider) {
    case "google":
    case "google-places":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "osm":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "wikivoyage":
    case "wikidata":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "openai":
      return "border-purple-200 bg-purple-50 text-purple-700";
    default:
      return "border-border bg-surface text-muted-foreground";
  }
}
