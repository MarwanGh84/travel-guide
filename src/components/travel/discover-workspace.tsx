"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  addPlaceToItinerary, 
  refreshDestinationsFromAi, 
  refreshPlacesFromProvider, 
  removeSelectedPlace, 
  planDestination,
  addSavedPlaceToDay,
  fetchLiveEvents
} from "@/app/actions";
import type { PlaceRecommendation, TripDraft, DestinationRecommendation } from "@/lib/types/travel";
import type { WeatherSummary } from "@/lib/api/weatherService";
import type { LiveEvent } from "@/lib/api/eventsService";
import { Info, Globe, CloudSun, Calendar, Compass, Sparkles, Bookmark, Star, Utensils, Church, Navigation } from "lucide-react";

import { CategoryRail } from "./discover/category-rail";
import { PlaceList } from "./discover/place-list";
import { IntelView } from "./discover/intel-view";
import { EventsView } from "./discover/events-view";
import { WeatherView } from "./discover/weather-view";
import { DetailPane } from "./discover/detail-pane";

type DiscoverWorkspaceProps = {
  trip: TripDraft | null;
  places: PlaceRecommendation[];
  destinations: DestinationRecommendation[];
  selectedIds: Set<string>;
  itineraryDays?: Array<{ id: string; date: string; theme: string }>;
  usedPlaceRecommendationIds?: Set<string>;
  intelligence?: {
    overview: string | null;
    neighborhoods: string[];
    culture: string | null;
    history: string | null;
    practicalNotes: string[];
    source: string;
  } | null;
  weather?: WeatherSummary | null;
};

export function DiscoverWorkspace({ 
  trip, 
  places = [], 
  destinations = [], 
  selectedIds = new Set(), 
  intelligence,
  itineraryDays = [],
  usedPlaceRecommendationIds = new Set(),
  weather
}: DiscoverWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const activeCategoryId = searchParams.get("category") || (intelligence ? "intel" : "all");
  const selectedIdFromUrl = searchParams.get("id") || "";

  const updateUrl = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const [query, setQuery] = useState("");
  const [showDetail, setShowDetail] = useState(Boolean(selectedIdFromUrl));
  const [status, setStatus] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [isFetchingEvents, setIsFetchingEvents] = useState(false);

  // Computed IDs from URL
  const selectedPlaceId = activeCategoryId !== "destinations" && activeCategoryId !== "events" ? selectedIdFromUrl : "";
  const selectedDestinationId = activeCategoryId === "destinations" 
    ? selectedIdFromUrl || (destinations.find((destination) =>
        destination.name === trip?.destination &&
        (!trip?.destinationCountry || destination.country === trip.destinationCountry)
      )?.id ?? "")
    : "";
  const selectedEventId = activeCategoryId === "events" ? selectedIdFromUrl : "";

  useEffect(() => {
    if (activeCategoryId === "events" && liveEvents.length === 0 && trip?.destination) {
      const loadEvents = async () => {
        setIsFetchingEvents(true);
        const res = await fetchLiveEvents(`Events in ${trip.destination}`, "next_week");
        if (res.ok && res.data) {
          setLiveEvents(res.data);
          if (res.data.length > 0 && !selectedIdFromUrl) {
            updateUrl({ id: res.data[0].id });
            setShowDetail(true);
          }
        }
        setIsFetchingEvents(false);
      };
      loadEvents();
    }
  }, [activeCategoryId, liveEvents.length, trip?.destination, selectedIdFromUrl, updateUrl]);

  const handleSelectEvent = (id: string) => {
    updateUrl({ id });
    setShowDetail(true);
  };

  const categories = [
    { id: "intel", label: "Intel", icon: Info },
    { id: "destinations", label: "Ideas", icon: Globe },
    { id: "weather", label: "Weather", icon: CloudSun },
    { id: "events", label: "Events", icon: Calendar },
    { id: "all", label: "All", icon: Compass },
    { id: "activities", label: "Activities", icon: Sparkles },
    { id: "saved", label: "Saved", icon: Bookmark },
    { id: "hidden", label: "Gems", icon: Star },
    { id: "food", label: "Food", icon: Utensils },
    { id: "culture", label: "Culture", icon: Church },
    { id: "nature", label: "Nature", icon: Navigation },
  ];

  const todayWeather = weather?.daily[0];
  const isGoodWeather = todayWeather && todayWeather.rainChance < 25 && todayWeather.maxC > 10 && todayWeather.maxC < 32;

  const filteredPlaces = places.filter((p) => {
    const haystack = `${p.name} ${p.category} ${p.location}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;

    if (activeCategoryId === "weather") {
       const isOutdoor = /park|garden|nature|viewpoint|beach|reserve|walking|hiking/i.test(`${p.category} ${p.name}`);
       const isIndoor = /museum|gallery|mall|restaurant|cafe|indoor|cinema|shopping|theatre|church/i.test(`${p.category} ${p.name}`);
       if (isGoodWeather) return isOutdoor || (!isIndoor && !isOutdoor); // Prefer outdoor on good days
       return isIndoor || (!isIndoor && !isOutdoor); // Prefer indoor on bad days
    }

    if (activeCategoryId === "all") return true;
    if (activeCategoryId === "saved") return selectedIds.has(p.id);
    if (activeCategoryId === "hidden") return p.isHiddenGem;
    if (activeCategoryId === "food") return /restaurant|cafe|bar|food|dining|eat/i.test(`${p.category} ${p.name}`);
    if (activeCategoryId === "culture") return /museum|temple|history|art|theatre|gallery|church|synagogue|mosque/i.test(`${p.category} ${p.name}`);
    if (activeCategoryId === "nature") return /park|garden|nature|viewpoint|beach|reserve|hiking|outdoor/i.test(`${p.category} ${p.name}`);
    if (activeCategoryId === "activities") return /do|activity|tour|experience|event|festival|market|show|zoo|aquarium|stadium/i.test(`${p.category} ${p.name}`);
    return true;
  });

  const filteredDestinations = destinations.filter((destination) => {
    if (!query) return true;
    return `${destination.name} ${destination.country}`.toLowerCase().includes(query.toLowerCase());
  });

  const isDestMode = activeCategoryId === "destinations";
  const isIntelMode = activeCategoryId === "intel";
  const isWeatherMode = activeCategoryId === "weather";
  const activePlace = places.find((p) => p.id === selectedPlaceId);
  const activeDestination = destinations.find((d) => d.id === selectedDestinationId);
  const activeEvent = liveEvents.find((e) => e.id === selectedEventId);
  const isSelected = activePlace ? selectedIds.has(activePlace.id) : false;
  const isCommittedDestination = Boolean(
    activeDestination &&
      activeDestination.name === trip?.destination &&
      (!trip?.destinationCountry || activeDestination.country === trip.destinationCountry),
  );

  const handleSelectPlace = (id: string) => {
    updateUrl({ id });
    setShowDetail(true);
  };

  const handleSelectDest = (id: string) => {
    updateUrl({ id });
    setShowDetail(true);
  };

  const handleRefreshPlaces = () => {
    startTransition(async () => {
      setStatus({ tone: "info", message: "Refreshing live place recommendations..." });
      try {
        await refreshPlacesFromProvider();
        router.refresh();
        setStatus({ tone: "success", message: "Live place recommendations refreshed." });
      } catch {
        setStatus({ tone: "error", message: "Could not refresh places. Try again." });
      }
    });
  };

  const handleRefreshAI = () => {
    startTransition(async () => {
      setStatus({ tone: "info", message: "Generating destination ideas..." });
      try {
        await refreshDestinationsFromAi();
        router.refresh();
        updateUrl({ category: "destinations", id: null });
        setStatus({ tone: "success", message: "Destination ideas refreshed." });
      } catch {
        setStatus({ tone: "error", message: "Could not generate destination ideas. Try again." });
      }
    });
  };

  const handleCommitDest = (formData: FormData) => {
    startTransition(async () => {
      setStatus({ tone: "info", message: "Committing destination and refreshing places..." });
      try {
        await planDestination(formData);
        router.refresh();
        window.dispatchEvent(new Event("trip-status-refresh"));
        updateUrl({ category: "intel", id: null });
        setStatus({ tone: "success", message: "Destination committed." });
      } catch {
        setStatus({ tone: "error", message: "Could not commit destination. Try again." });
      }
    });
  };

  const handlePlaceAction = (formData: FormData) => {
    startTransition(async () => {
      try {
        if (isSelected) {
          await removeSelectedPlace(formData);
          setStatus({ tone: "success", message: "Place removed from saved places." });
        } else {
          await addPlaceToItinerary(formData);
          setStatus({ tone: "success", message: "Place saved for itinerary planning." });
        }
        router.refresh();
        window.dispatchEvent(new Event("trip-status-refresh"));
      } catch {
        setStatus({ tone: "error", message: "Could not update saved places. Try again." });
      }
    });
  };

  const handleUseInItinerary = (dayId: string, timeOfDay: string) => {
    const formData = new FormData();
    formData.append("placeId", selectedPlaceId);
    formData.append("dayId", dayId);
    formData.append("timeOfDay", timeOfDay);

    startTransition(async () => {
      setStatus({ tone: "info", message: `Scheduling ${activePlace?.name}...` });
      try {
        await addSavedPlaceToDay(formData);
        setStatus({ tone: "success", message: `${activePlace?.name} added to itinerary.` });
        setChooserOpen(false);
        router.refresh();
      } catch (error) {
        setStatus({ tone: "error", message: error instanceof Error ? error.message : "Could not add to itinerary." });
      }
    });
  };

  const hasNoDataYet = Boolean(trip) && !intelligence && places.length === 0 && destinations.length === 0;

  return (
    <div className="flex h-full w-full overflow-hidden flex-col lg:flex-row bg-background">
      <CategoryRail
        activeCategoryId={activeCategoryId}
        categories={categories}
        todayWeather={todayWeather ? {
          label: todayWeather.label,
          maxC: todayWeather.maxC,
          weatherCode: todayWeather.weatherCode
        } : undefined}
        isPending={isPending}
        onSelectCategory={(id) => { updateUrl({ category: id, id: null }); setShowDetail(false); }}
        onRefreshPlaces={handleRefreshPlaces}
        onRefreshAI={handleRefreshAI}
      />

      {isIntelMode ? (
        <IntelView
          trip={trip}
          intelligence={intelligence}
          isPending={isPending}
          onRefreshPlaces={handleRefreshPlaces}
        />
      ) : activeCategoryId === "events" ? (
        <EventsView
          isFetchingEvents={isFetchingEvents}
          liveEvents={liveEvents}
          selectedEventId={selectedEventId}
          onSelectEvent={handleSelectEvent}
        />
      ) : isWeatherMode ? (
        <WeatherView
          todayWeather={todayWeather!}
          isGoodWeather={Boolean(isGoodWeather)}
          filteredPlaces={filteredPlaces}
          onSelectPlace={handleSelectPlace}
        />
      ) : (
        <PlaceList
          isDestMode={isDestMode}
          query={query}
          onQueryChange={setQuery}
          filteredDestinations={filteredDestinations}
          filteredPlaces={filteredPlaces}
          selectedDestinationId={selectedDestinationId}
          selectedPlaceId={selectedPlaceId}
          onSelectDest={handleSelectDest}
          onSelectPlace={handleSelectPlace}
          selectedIds={selectedIds}
          hasNoDataYet={hasNoDataYet}
          isPending={isPending}
          onRefreshPlaces={handleRefreshPlaces}
          onRefreshAI={handleRefreshAI}
        />
      )}

      <DetailPane
        showDetail={showDetail}
        setShowDetail={setShowDetail}
        status={status}
        isDestMode={isDestMode}
        isEventsMode={activeCategoryId === "events"}
        activeDestination={activeDestination}
        activeEvent={activeEvent}
        activePlace={activePlace}
        isPending={isPending}
        isCommittedDestination={isCommittedDestination}
        isSelected={isSelected}
        usedPlaceRecommendationIds={usedPlaceRecommendationIds || new Set()}
        itineraryDays={itineraryDays}
        chooserOpen={chooserOpen}
        setChooserOpen={setChooserOpen}
        onCommitDest={handleCommitDest}
        onPlaceAction={handlePlaceAction}
        onUseInItinerary={handleUseInItinerary}
        onGoToTimeline={() => router.push("/itinerary")}
      />
    </div>
  );
}
