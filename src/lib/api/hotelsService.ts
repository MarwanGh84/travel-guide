import { DataSource, HotelResult } from "@/lib/types/travel";

export async function searchLiveHotels(
  lat: number,
  lng: number,
  checkinDate: string,
  checkoutDate: string,
  guests: number
): Promise<HotelResult[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = process.env.RAPIDAPI_HOST || "booking-com15.p.rapidapi.com";

  if (!apiKey) {
    console.warn("RapidAPI Key missing. Falling back to mock data.");
    return getMockHotels();
  }

  try {
    // Standard endpoint for booking-com15.p.rapidapi.com
    const url = new URL(`https://${apiHost}/api/v1/hotels/searchHotelsByCoordinates`);
    url.searchParams.append("latitude", lat.toString());
    url.searchParams.append("longitude", lng.toString());
    url.searchParams.append("arrival_date", checkinDate);
    url.searchParams.append("departure_date", checkoutDate);
    url.searchParams.append("adults", guests.toString());
    url.searchParams.append("room_qty", "1");
    url.searchParams.append("currency_code", "USD");
    url.searchParams.append("languagecode", "en-us");
    
    // Proximity parameters
    url.searchParams.append("sort_by", "distance");
    url.searchParams.append("radius", "5"); // Search within 5km radius

    console.log(`RapidAPI: Fetching hotels for coordinates ${lat},${lng} (Radius: 5km, Sort: Distance)`);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": apiHost,
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`RapidAPI Error (${response.status}): ${errorText}`);
      return getMockHotels();
    }

    const data = await response.json();
    const hotels = data.data?.result || data.result || [];
    
    console.log(`RapidAPI: Found ${Array.isArray(hotels) ? hotels.length : 0} hotels.`);

    if (!Array.isArray(hotels) || hotels.length === 0) {
      return getMockHotels();
    }

    return hotels.slice(0, 8).map((hotel: {
      hotel_name?: string;
      city?: string;
      district?: string;
      review_score?: number;
      review_score_word?: string;
      composite_price_breakdown?: { gross_amount_per_night?: { value?: number } };
      min_total_price?: number;
      main_photo_url?: string;
      checkin?: { from?: string };
    }) => {
      const price = hotel.composite_price_breakdown?.gross_amount_per_night?.value || hotel.min_total_price || 0;
      const photo = hotel.main_photo_url ? hotel.main_photo_url.replace("square60", "max1280x900") : undefined;
      
      return {
        name: hotel.hotel_name || "Unknown Hotel",
        area: hotel.city || hotel.district || "Local Area",
        rating: hotel.review_score || 0,
        estimatedPricePerNight: Math.round(price),
        amenities: [
          "Near Sector Hub",
          hotel.review_score_word || "Verified",
          hotel.checkin?.from ? `Check-in: ${hotel.checkin.from}` : ""
        ].filter(Boolean),
        bookingLink: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.hotel_name || "hotel")}`,
        photoUrl: photo,
        source: {
          provider: "booking.com",
          isMock: false,
          note: "Live data via booking-com15",
        },
      };
    });
  } catch (error) {
    console.error("RapidAPI: Fetch exception:", error);
    return getMockHotels();
  }
}

function getMockHotels(): HotelResult[] {
  return [
    {
      name: "The Grand Explorer Hotel",
      area: "Central District",
      rating: 4.8,
      estimatedPricePerNight: 245,
      amenities: ["Free WiFi", "Pool", "Central Location"],
      source: { provider: "mock", isMock: true, note: "API fallback enabled." }
    },
    {
      name: "Boutique Oasis",
      area: "Historic Quarter",
      rating: 4.5,
      estimatedPricePerNight: 180,
      amenities: ["Breakfast Included", "Walking Distance"],
      source: { provider: "mock", isMock: true, note: "API fallback enabled." }
    }
  ];
}
