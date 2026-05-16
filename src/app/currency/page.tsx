import { CurrencyWorkspace } from "@/components/travel/currency-workspace";
import { getExchangeRate } from "@/lib/api/currencyService";
import { getPrimaryTrip } from "@/lib/db/travel";
import { tripLength } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CurrencyPage() {
  const trip = await getPrimaryTrip();
  const baseCurrency = "AED";
  const targetCurrency = getCurrencyForCountry(trip?.destinationCountry || "");
  
  const initialRate = targetCurrency ? await getExchangeRate(baseCurrency, targetCurrency) : null;
  const tripBudget = trip?.budget ?? 0;
  const tripDuration = trip ? tripLength(trip.startDate, trip.endDate) : 0;

  return (
    <CurrencyWorkspace 
      baseCurrency={baseCurrency}
      targetCurrency={targetCurrency}
      initialRate={initialRate}
      tripBudget={tripBudget}
      tripDuration={tripDuration}
    />
  );
}

function getCurrencyForCountry(country: string): string | null {
  const map: Record<string, string> = {
    "Japan": "JPY",
    "United Kingdom": "GBP",
    "UK": "GBP",
    "France": "EUR",
    "Germany": "EUR",
    "Italy": "EUR",
    "Spain": "EUR",
    "Switzerland": "CHF",
    "United Arab Emirates": "AED",
    "UAE": "AED",
    "Thailand": "THB",
    "Singapore": "SGD",
    "Australia": "AUD",
    "Canada": "CAD",
    "Turkey": "TRY",
    "Lebanon": "LBP",
    "Indonesia": "IDR",
    "Bali": "IDR"
  };

  const normalized = country.trim();
  return map[normalized] || null;
}
