export function getCurrencyForCountry(country: string): string | null {
  const map: Record<string, string> = {
    Australia: "AUD",
    Austria: "EUR",
    Belgium: "EUR",
    Bali: "IDR",
    Brazil: "BRL",
    Canada: "CAD",
    China: "CNY",
    Croatia: "EUR",
    Denmark: "DKK",
    Egypt: "EGP",
    Finland: "EUR",
    France: "EUR",
    Germany: "EUR",
    Greece: "EUR",
    "Hong Kong": "HKD",
    Hungary: "HUF",
    Iceland: "ISK",
    India: "INR",
    Indonesia: "IDR",
    Ireland: "EUR",
    Israel: "ILS",
    Italy: "EUR",
    Japan: "JPY",
    Jordan: "JOD",
    Lebanon: "LBP",
    Malaysia: "MYR",
    Mexico: "MXN",
    Morocco: "MAD",
    Netherlands: "EUR",
    "New Zealand": "NZD",
    Norway: "NOK",
    Philippines: "PHP",
    Poland: "PLN",
    Portugal: "EUR",
    Qatar: "QAR",
    Saudi: "SAR",
    "Saudi Arabia": "SAR",
    Singapore: "SGD",
    "South Africa": "ZAR",
    "South Korea": "KRW",
    Spain: "EUR",
    Sweden: "SEK",
    Switzerland: "CHF",
    Thailand: "THB",
    Turkey: "TRY",
    UAE: "AED",
    UK: "GBP",
    "United Arab Emirates": "AED",
    "United Kingdom": "GBP",
    USA: "USD",
    "United States": "USD",
    Vietnam: "VND",
  };

  const normalized = country.trim();
  if (map[normalized]) return map[normalized];

  // Try case-insensitive and partial matches
  const entries = Object.entries(map);
  const match = entries.find(([name]) => normalized.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(normalized.toLowerCase()));
  
  return match ? match[1] : null;
}

export function detectCurrency(text: string | null | undefined): string | null {
  if (!text) return null;
  const commonCountries = [
    "Australia", "Austria", "Belgium", "Brazil", "Canada", "China", "Croatia", "Denmark", "Egypt", 
    "Finland", "France", "Germany", "Greece", "Hong Kong", "Hungary", "Iceland", "India", 
    "Indonesia", "Ireland", "Israel", "Italy", "Japan", "Jordan", "Lebanon", "Malaysia", "Mexico", 
    "Morocco", "Netherlands", "New Zealand", "Norway", "Philippines", "Poland", "Portugal", "Qatar", 
    "Saudi Arabia", "Singapore", "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", 
    "Thailand", "Turkey", "UAE", "UK", "USA", "United Arab Emirates", "United Kingdom", "United States", "Vietnam"
  ];

  for (const country of commonCountries) {
    if (text.toLowerCase().includes(country.toLowerCase())) {
      return getCurrencyForCountry(country);
    }
  }

  return null;
}
