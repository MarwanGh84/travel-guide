import { getPrimaryTrip, getOrCreateUser } from "@/lib/db/travel";
import { prisma } from "@/lib/db/prisma";
import { getWeatherSummary } from "@/lib/api/weatherService";
import { getExchangeRate } from "@/lib/api/currencyService";
import { getCurrencyForCountry, detectCurrency } from "@/lib/travel/currencies";
import { TripPackView } from "@/components/travel/trip-pack-view";

export const dynamic = "force-dynamic";

export default async function TripPackPage() {
  const user = await getOrCreateUser();
  const trip = await getPrimaryTrip();
  
  if (!trip) {
    return <TripPackView trip={null} weather={null} exchangeRate={null} driveSources={[]} />;
  }

  // Fetch drive sources for the user
  const driveSources = await prisma.driveMemorySource.findMany({
    where: { userId: user.id }
  });

  // Fetch weather summary
  const destinationStr = [trip.destination, trip.destinationCountry].filter(Boolean).join(", ");
  const weather = await getWeatherSummary(destinationStr);

  // Fetch exchange rate
  const baseCurrency = trip.currency || "USD";
  let targetCurrency = getCurrencyForCountry(trip.destinationCountry || "");
  if (!targetCurrency && trip.destination) {
    targetCurrency = detectCurrency(trip.destination);
  }
  const exchangeRate = targetCurrency 
    ? await getExchangeRate(baseCurrency, targetCurrency)
    : { base: baseCurrency, quote: "N/A", rate: 0, source: { note: "Target currency not detected" } };

  return (
    <TripPackView 
      trip={trip} 
      weather={weather} 
      exchangeRate={exchangeRate} 
      driveSources={driveSources} 
    />
  );
}
