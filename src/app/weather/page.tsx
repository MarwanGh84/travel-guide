import { getPrimaryTrip, toItineraryDays } from "@/lib/db/travel";
import { getWeatherSummary } from "@/lib/api/weatherService";
import { WeatherWorkspace } from "@/components/travel/weather-workspace";
import { computeItineraryWeatherImpact, generatePackingSuggestions } from "@/lib/travel/weather-intelligence";
import { tripLength } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WeatherPage() {
  const trip = await getPrimaryTrip();
  
  if (!trip) {
    return (
      <div className="flex h-full items-center justify-center p-12 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-muted">Establish a trip brief to enable weather intelligence.</p>
      </div>
    );
  }

  const destinationStr = [trip.destination, trip.destinationCountry].filter(Boolean).join(", ");
  const weather = await getWeatherSummary(destinationStr);
  const itineraryDays = toItineraryDays(trip);
  const durationDays = tripLength(trip.startDate, trip.endDate);
  
  const weatherImpact = computeItineraryWeatherImpact(itineraryDays, weather);
  const packingSuggestions = generatePackingSuggestions(weather, itineraryDays, durationDays);

  return (
    <WeatherWorkspace 
      trip={trip}
      weather={weather}
      weatherImpact={weatherImpact}
      packingSuggestions={packingSuggestions}
    />
  );
}
