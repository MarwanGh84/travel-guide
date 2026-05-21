import { CurrencyWorkspace } from "@/components/travel/currency-workspace";
import { getExchangeRate } from "@/lib/api/currencyService";
import { getPrimaryTrip } from "@/lib/db/travel";
import { getCurrencyForCountry, detectCurrency } from "@/lib/travel/currencies";
import { tripLength } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CurrencyPage() {
  const trip = await getPrimaryTrip();
  const baseCurrency = trip?.currency ?? "USD";
  
  // Try to detect currency from country first, then from destination name
  let targetCurrency = getCurrencyForCountry(trip?.destinationCountry || "");
  if (!targetCurrency && trip?.destination) {
    targetCurrency = detectCurrency(trip.destination);
  }
  
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
