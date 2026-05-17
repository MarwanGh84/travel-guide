export function getCurrencyForCountry(country: string): string | null {
  const map: Record<string, string> = {
    Australia: "AUD",
    Bali: "IDR",
    Canada: "CAD",
    France: "EUR",
    Germany: "EUR",
    Indonesia: "IDR",
    Italy: "EUR",
    Japan: "JPY",
    Lebanon: "LBP",
    Singapore: "SGD",
    Spain: "EUR",
    Switzerland: "CHF",
    Thailand: "THB",
    Turkey: "TRY",
    UAE: "AED",
    UK: "GBP",
    "United Arab Emirates": "AED",
    "United Kingdom": "GBP",
  };

  return map[country.trim()] ?? null;
}
