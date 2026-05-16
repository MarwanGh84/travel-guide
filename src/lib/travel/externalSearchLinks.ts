export type TravelSearchContext = {
  destination?: string | null;
  destinationCountry?: string | null;
  departureCity?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  travelerCount?: number | null;
  hotelAreaHint?: string | null;
};

export type ExternalSearchLink = {
  id: string;
  label: string;
  provider: string;
  category: "Flights" | "Hotels" | "Activities";
  href: string;
  description: string;
  note: string;
};

export type ExternalSearchSummary = {
  destination: string;
  departureCity: string;
  dates: string;
  travelers: number;
  hotelAreaHint: string;
  text: string;
};

export type HotelAreaPlace = {
  name?: string | null;
  category?: string | null;
  isHiddenGem?: boolean | null;
};

export function getExternalSearchLinks(context: TravelSearchContext | null | undefined): ExternalSearchLink[] {
  const summary = getExternalSearchSummary(context);
  const startDate = formatDate(context?.startDate);
  const endDate = formatDate(context?.endDate);

  return [
    {
      id: "booking-hotels",
      label: "Find hotels",
      provider: "Booking.com",
      category: "Hotels",
      href: bookingUrl(summary.destination, startDate, endDate, summary.travelers),
      description: `Hotel search for ${summary.destination}. ${summary.hotelAreaHint}`,
      note: "Book on Booking.com, then import the confirmation from Gmail.",
    },
    {
      id: "expedia-hotels",
      label: "Find hotels",
      provider: "Expedia",
      category: "Hotels",
      href: expediaHotelUrl(summary.destination, startDate, endDate, summary.travelers),
      description: `Hotel search for ${summary.destination}. ${summary.hotelAreaHint}`,
      note: "Book on Expedia, then import the confirmation from Gmail.",
    },
    {
      id: "google-flights",
      label: "Compare flights",
      provider: "Google Flights",
      category: "Flights",
      href: googleFlightsUrl(summary.departureCity, summary.destination, startDate, endDate, summary.travelers),
      description: `Flight search from ${summary.departureCity} to ${summary.destination}.`,
      note: "If dates or airports do not prefill perfectly, use the copied trip details.",
    },
    {
      id: "skyscanner-flights",
      label: "Compare flights",
      provider: "Skyscanner",
      category: "Flights",
      href: skyscannerUrl(summary.departureCity, summary.destination, startDate, endDate),
      description: `Flight comparison shortcut for ${summary.destination}.`,
      note: "Skyscanner may ask you to confirm airport codes on the opened page.",
    },
    {
      id: "getyourguide-activities",
      label: "Find tours",
      provider: "GetYourGuide",
      category: "Activities",
      href: getYourGuideUrl(summary.destination, startDate, endDate, summary.travelers),
      description: `Tours, tickets, and activities search for ${summary.destination}.`,
      note: "Book on GetYourGuide, then import the confirmation from Gmail.",
    },
  ];
}

export function getExternalSearchSummary(context: TravelSearchContext | null | undefined): ExternalSearchSummary {
  const destination = destinationLabel(context);
  const departureCity = cleanText(context?.departureCity) || "your departure city";
  const startDate = formatDate(context?.startDate);
  const endDate = formatDate(context?.endDate);
  const travelers = Math.max(1, Number(context?.travelerCount ?? 1) || 1);
  const dates = startDate && endDate ? `${startDate} to ${endDate}` : "dates not set";
  const hotelAreaHint = cleanText(context?.hotelAreaHint) || "Use your saved places on the map to choose a walkable hotel area.";
  const text = [
    `Destination: ${destination}`,
    `Departure city: ${departureCity}`,
    `Dates: ${dates}`,
    `Travelers: ${travelers}`,
    `Hotel area hint: ${hotelAreaHint}`,
  ].join("\n");

  return { destination, departureCity, dates, travelers, hotelAreaHint, text };
}

export function getHotelAreaHintFromPlaces(places: HotelAreaPlace[] | null | undefined) {
  const list = places ?? [];
  const area = list.find((place) => /neighbou?rhood|district|area|quarter|old town|downtown|center|centre/i.test(place.category ?? place.name ?? ""));
  if (area?.name) return `Good hotel-area starting point: ${area.name}.`;

  const hiddenGem = list.find((place) => place.isHiddenGem);
  if (hiddenGem?.name) return `Consider staying within easy reach of saved places like ${hiddenGem.name}.`;

  const firstPlace = list[0];
  if (firstPlace?.name) return `Use saved places like ${firstPlace.name} to choose a convenient hotel area.`;

  return "Use your saved places on the map to choose a walkable hotel area.";
}

export function withHotelAreaHint<T extends TravelSearchContext | null | undefined>(
  context: T,
  places: HotelAreaPlace[] | null | undefined,
): TravelSearchContext | null {
  if (!context) return null;
  return { ...context, hotelAreaHint: getHotelAreaHintFromPlaces(places) };
}

function bookingUrl(destination: string, startDate: string, endDate: string, travelers: number) {
  const params = new URLSearchParams({
    ss: destination,
    group_adults: String(travelers),
    no_rooms: "1",
    group_children: "0",
  });
  if (startDate) params.set("checkin", startDate);
  if (endDate) params.set("checkout", endDate);
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

function expediaHotelUrl(destination: string, startDate: string, endDate: string, travelers: number) {
  const params = new URLSearchParams({
    destination,
    rooms: `1_${travelers}`,
  });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return `https://www.expedia.com/Hotel-Search?${params.toString()}`;
}

function googleFlightsUrl(departureCity: string, destination: string, startDate: string, endDate: string, travelers: number) {
  const dateText = startDate && endDate ? ` from ${startDate} to ${endDate}` : "";
  const passengerText = travelers > 1 ? ` for ${travelers} travelers` : "";
  const params = new URLSearchParams({
    q: `Flights from ${departureCity} to ${destination}${dateText}${passengerText}`,
  });
  return `https://www.google.com/travel/flights?${params.toString()}`;
}

function skyscannerUrl(departureCity: string, destination: string, startDate: string, endDate: string) {
  const params = new URLSearchParams({
    from: departureCity,
    to: destination,
  });
  if (startDate) params.set("depart", startDate);
  if (endDate) params.set("return", endDate);
  return `https://www.skyscanner.com/transport/flights?${params.toString()}`;
}

function getYourGuideUrl(destination: string, startDate: string, endDate: string, travelers: number) {
  const query = [destination, "tours activities tickets"].filter(Boolean).join(" ");
  const params = new URLSearchParams({ q: query });
  if (startDate) params.set("date_from", startDate);
  if (endDate) params.set("date_to", endDate);
  params.set("participants", String(travelers));
  return `https://www.getyourguide.com/s/?${params.toString()}`;
}

function destinationLabel(context: TravelSearchContext | null | undefined) {
  const destination = cleanText(context?.destination);
  const country = cleanText(context?.destinationCountry);
  if (destination && country && destination.toLowerCase() === country.toLowerCase()) return destination;
  return [destination, country].filter(Boolean).join(", ") || "your destination";
}

function cleanText(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}
