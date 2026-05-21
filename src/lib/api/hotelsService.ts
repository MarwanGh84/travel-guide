import type { HotelResult } from "@/lib/types/travel";
import type { HotelInventoryStatus } from "@/lib/types/stays";
import { RapidHotelSearchResponseSchema } from "@/lib/validation/schemas";

export type HotelInventoryResult = {
  hotels: HotelResult[];
  status: HotelInventoryStatus;
  message: string;
  provider: "rapidapi-booking-com15";
};

export async function searchLiveHotels(
  lat: number,
  lng: number,
  checkinDate: string,
  checkoutDate: string,
  guests: number,
): Promise<HotelInventoryResult> {
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = process.env.RAPIDAPI_HOST || "booking-com15.p.rapidapi.com";

  if (!apiKey) {
    return {
      hotels: [],
      status: "missing-credentials",
      message: "Live hotel inventory unavailable because RapidAPI credentials are not configured.",
      provider: "rapidapi-booking-com15",
    };
  }

  try {
    const url = new URL(`https://${apiHost}/api/v1/hotels/searchHotelsByCoordinates`);
    url.searchParams.append("latitude", lat.toString());
    url.searchParams.append("longitude", lng.toString());
    url.searchParams.append("arrival_date", checkinDate);
    url.searchParams.append("departure_date", checkoutDate);
    url.searchParams.append("adults", guests.toString());
    url.searchParams.append("room_qty", "1");
    url.searchParams.append("currency_code", "USD");
    url.searchParams.append("languagecode", "en-us");
    url.searchParams.append("sort_by", "distance");
    // booking-com15 rejects `5`; `10` is the smallest verified radius that returns a valid response.
    url.searchParams.append("radius", "10");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": apiHost,
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const providerMessage = await response.text();
      return {
        hotels: [],
        status: "provider-error",
        message: `Live hotel inventory unavailable: provider returned ${response.status}${providerMessage ? ` ${providerMessage}` : ""}.`,
        provider: "rapidapi-booking-com15",
      };
    }

    const payload = RapidHotelSearchResponseSchema.parse(await response.json());
    if (payload.status === false) {
      return {
        hotels: [],
        status: "provider-error",
        message: `Live hotel inventory unavailable: provider rejected the request${formatProviderMessage(payload.message)}.`,
        provider: "rapidapi-booking-com15",
      };
    }
    const providerHotels = payload.data?.result ?? payload.result ?? [];
    if (!providerHotels.length) {
      return {
        hotels: [],
        status: "empty",
        message: "Live hotel inventory returned no available properties for these coordinates and dates.",
        provider: "rapidapi-booking-com15",
      };
    }

    const hotels = providerHotels.map((hotel) => {
        const nightlyPrice = hotel.composite_price_breakdown?.gross_amount_per_night?.value;
        const fallbackTotalPrice = hotel.min_total_price;
        const photoUrl = hotel.main_photo_url ? hotel.main_photo_url.replace("square60", "max1280x900") : undefined;
        return {
          name: hotel.hotel_name || "Unnamed property",
          area: hotel.city || hotel.district || "Area unavailable",
          rating: hotel.review_score ?? undefined,
          estimatedPricePerNight: nightlyPrice ?? fallbackTotalPrice,
          currency: hotel.composite_price_breakdown?.gross_amount_per_night?.currency ?? hotel.currency_code,
          availability: true,
          distanceKm: parseDistanceKm(hotel.distance_to_cc),
          coordinates:
            typeof hotel.latitude === "number" && typeof hotel.longitude === "number"
              ? { lat: hotel.latitude, lng: hotel.longitude }
              : undefined,
          amenities: [
            hotel.review_score_word,
            hotel.checkin?.from ? `Check-in from ${hotel.checkin.from}` : undefined,
          ].filter((item): item is string => Boolean(item)),
          bookingLink: hotel.url,
          photoUrl,
          source: {
            provider: "Booking.com / RapidAPI",
            isMock: false,
            note: "Live provider inventory via booking-com15 RapidAPI wrapper.",
            classification: "provider" as const,
          },
        };
      });

    hotels.sort((a, b) => {
      const distanceDelta = (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY);
      if (distanceDelta !== 0) return distanceDelta;
      return (b.rating ?? -1) - (a.rating ?? -1);
    });

    return {
      hotels: hotels.slice(0, 8),
      status: "live",
      message: "Live hotel inventory from Booking.com / RapidAPI.",
      provider: "rapidapi-booking-com15",
    };
  } catch (error) {
    return {
      hotels: [],
      status: "provider-error",
      message: error instanceof Error ? `Live hotel inventory unavailable: ${error.message}` : "Live hotel inventory unavailable.",
      provider: "rapidapi-booking-com15",
    };
  }
}

function parseDistanceKm(value?: string) {
  if (!value) return undefined;
  const normalized = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(normalized) ? normalized : undefined;
}

function formatProviderMessage(message: string | Array<Record<string, string>> | undefined) {
  if (!message) return ".";
  if (typeof message === "string") return ` (${message}).`;
  const details = message
    .flatMap((entry) => Object.entries(entry).map(([key, value]) => `${key}: ${value}`))
    .join(", ");
  return details ? ` (${details}).` : ".";
}
