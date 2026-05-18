export type TravelStyle =
  | "relaxed"
  | "balanced"
  | "adventure"
  | "luxury"
  | "family"
  | "romantic"
  | "cultural";

export type TravelPace = "slow" | "medium" | "packed";

export type DataSource = {
  provider: string;
  isMock: boolean;
  note: string;
  classification?: "provider" | "ai" | "computed" | "fallback" | "manual";
};

export type TripDraft = {
  name: string;
  destination?: string;
  destinationCountry?: string;
  departureCity: string;
  startDate: string;
  endDate: string;
  travelerCount: number;
  budget: number;
  travelStyle: TravelStyle;
  pace: TravelPace;
  interests: string[];
  notes?: string;
  status: string;
  itineraryApprovedAt?: string | null;
};

export type DestinationRecommendation = {
  id: string;
  name: string;
  country: string;
  whyItMatches: string;
  bestThingsToDo: string[];
  estimatedCost: number;
  weatherSummary: string;
  flightEstimate: string;
  hotelEstimate: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
  suggestedTripDuration: string;
  confidenceScore: number;
  source: DataSource;
};

export type PlaceRecommendation = {
  id: string;
  name: string;
  category: string;
  description: string;
  rating?: number;
  costLevel: "$" | "$$" | "$$$" | "$$$$";
  location: string;
  coordinates?: { lat: number; lng: number };
  openingStatus?: string;
  whyRecommended: string;
  isHiddenGem: boolean;
  hiddenGemScore: number;
  source: DataSource;
};

export type ItineraryDay = {
  id: string;
  date: string;
  theme: string;
  morningPlan: string;
  afternoonPlan: string;
  eveningPlan: string;
  placesIncluded: string[];
  places?: Array<{
    id: string;
    title: string;
    timeOfDay?: string;
    placeRecommendationId?: string;
    place?: PlaceRecommendation;
  }>;
  restaurantIdeas: string[];
  hiddenGem: string;
  estimatedCost: number;
  transportNotes: string;
  backupOption: string;
  notes: string;
};

export type BudgetCategory = {
  name: string;
  estimated: number;
  actual: number;
};

export type Booking = {
  type: string;
  title: string;
  provider?: string;
  confirmationNumber?: string;
  time?: string;
  link?: string;
  notes?: string;
};

export type FlightSearchParams = {
  departureCity: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  cabinClass?: string;
};

export type FlightResult = {
  airline: string;
  estimatedPrice: number;
  duration: string;
  stops: number;
  bookingLink?: string;
  source: DataSource;
};

export type HotelSearchParams = {
  destination: string;
  startDate: string;
  endDate: string;
  guests: number;
  budgetLevel: string;
};

export type HotelResult = {
  name: string;
  area: string;
  rating?: number;
  estimatedPricePerNight?: number;
  currency?: string;
  availability?: boolean;
  distanceKm?: number;
  averageItineraryDistanceKm?: number;
  nearestItineraryPlace?: string;
  coordinates?: { lat: number; lng: number };
  amenities: string[];
  bookingLink?: string;
  photoUrl?: string;
  source: DataSource;
};
