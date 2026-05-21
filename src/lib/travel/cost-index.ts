/**
 * A lightweight, static lookup table mapping countries/regions to a Cost Multiplier.
 * Base multiplier is 1.0 (e.g., standard USA / Western Europe costs).
 */

const costMultipliers: Record<string, number> = {
  // High Cost
  "Switzerland": 1.5,
  "Norway": 1.4,
  "Iceland": 1.4,
  "Denmark": 1.3,
  "Singapore": 1.2,
  "Australia": 1.2,
  "New Zealand": 1.1,

  // Baseline (1.0)
  "USA": 1.0,
  "United States": 1.0,
  "UK": 1.0,
  "United Kingdom": 1.0,
  "France": 1.0,
  "Germany": 1.0,
  "Canada": 1.0,
  "Japan": 1.0,
  "Italy": 0.9,
  "Spain": 0.8,
  "Portugal": 0.8,
  "Greece": 0.8,

  // Medium Cost
  "Croatia": 0.7,
  "South Korea": 0.7,
  "Mexico": 0.6,
  "Brazil": 0.6,
  "South Africa": 0.6,
  "Turkey": 0.5,

  // Lower Cost
  "Thailand": 0.4,
  "Vietnam": 0.3,
  "Indonesia": 0.4,
  "Bali": 0.4, // Often requested specifically
  "Philippines": 0.4,
  "Malaysia": 0.5,
  "India": 0.3,
  "Egypt": 0.3,
  "Morocco": 0.4,
};

/**
 * Returns a cost multiplier based on the destination country.
 * Defaults to 1.0 if the country is not found.
 */
export function getDestinationMultiplier(country: string | null | undefined): number {
  if (!country) return 1.0;
  
  const normalized = country.trim();
  if (costMultipliers[normalized]) return costMultipliers[normalized];

  // Case-insensitive / partial match
  const entries = Object.entries(costMultipliers);
  const match = entries.find(([name]) => 
    normalized.toLowerCase().includes(name.toLowerCase()) || 
    name.toLowerCase().includes(normalized.toLowerCase())
  );
  
  return match ? match[1] : 1.0;
}
