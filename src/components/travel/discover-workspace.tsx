"use client";

import { useState, useEffect, useTransition, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  addPlaceToItinerary, 
  refreshDestinationsFromAi, 
  refreshPlacesFromProvider, 
  removeSelectedPlace, 
  planDestination,
  addSavedPlaceToDay,
  fetchLiveEvents,
  fetchCommunityRecommendations
} from "@/app/actions";
import type { PlaceRecommendation, TripDraft, DestinationRecommendation, CommunityRecommendation } from "@/lib/types/travel";
import type { WeatherSummary } from "@/lib/api/weatherService";
import type { LiveEvent } from "@/lib/api/eventsService";
import { Info, Globe, CloudSun, Calendar, Compass, Sparkles, Bookmark, Star, Utensils, Church, Navigation, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { CategoryRail } from "./discover/category-rail";
import { PlaceList } from "./discover/place-list";
import { IntelView } from "./discover/intel-view";
import { EventsView } from "./discover/events-view";
import { CommunityView } from "./discover/community-view";
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

  const [isPending, startTransition] = useTransition();

  const updateUrl = useCallback((updates: Record<string, string | null>) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [router, pathname, searchParams, startTransition]);

  const [query, setQuery] = useState("");
  const [showDetail, setShowDetail] = useState(Boolean(selectedIdFromUrl));
  const [status, setStatus] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [isFetchingEvents, setIsFetchingEvents] = useState(false);
  const [priceFilter, setPriceFilter] = useState<string | null>(null);
  const [communityItems, setCommunityItems] = useState<CommunityRecommendation[]>([]);
  const [isFetchingCommunity, setIsFetchingCommunity] = useState(false);
  const [communityNotConnected, setCommunityNotConnected] = useState(false);
  const [communityFocus, setCommunityFocus] = useState<"hidden-gems" | "restaurants">("hidden-gems");
  const [communityLoadedKey, setCommunityLoadedKey] = useState("");
  const [autoRefreshCount, setAutoRefreshCount] = useState(0);

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

  useEffect(() => {
    const destination = trip?.destination;
    if (activeCategoryId !== "community" || !destination) return;
    const key = `${destination}|${communityFocus}`;
    if (key === communityLoadedKey) return;
    let cancelled = false;
    const loadCommunity = async () => {
      setIsFetchingCommunity(true);
      const res = await fetchCommunityRecommendations(destination, communityFocus);
      if (cancelled) return;
      setCommunityItems(res.data ?? []);
      setCommunityNotConnected(Boolean(res.isMock));
      setCommunityLoadedKey(key);
      setIsFetchingCommunity(false);
    };
    loadCommunity();
    return () => {
      cancelled = true;
    };
  }, [activeCategoryId, trip?.destination, communityFocus, communityLoadedKey]);

  const handleSelectEvent = (id: string) => {
    updateUrl({ id });
    setShowDetail(true);
  };

  const categories = [
    { id: "intel", label: "Intel", icon: Info },
    { id: "destinations", label: "Ideas", icon: Globe },
    { id: "community", label: "Community", icon: Users },
    { id: "weather", label: "Weather", icon: CloudSun },
    { id: "events", label: "Events", icon: Calendar },
    { id: "all", label: "All", icon: Compass },
    { id: "things", label: "Things to Do", icon: Sparkles },
    { id: "saved", label: "Saved", icon: Bookmark },
    { id: "hidden", label: "Gems", icon: Star },
    { id: "food", label: "Food", icon: Utensils },
    { id: "culture", label: "Culture", icon: Church },
    { id: "nature", label: "Nature", icon: Navigation },
  ];

  const todayWeather = weather?.daily[0];
  const isGoodWeather = todayWeather && todayWeather.rainChance < 25 && todayWeather.maxC > 10 && todayWeather.maxC < 32;

  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
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
      if (activeCategoryId === "food") {
        const isFood = /restaurant|cafe|bar|food|dining|eat|bistro|brasserie|izakaya|trattoria|coffee/i.test(`${p.category} ${p.name}`);
        if (!isFood) return false;
        if (priceFilter && p.costLevel !== priceFilter) return false;
        return true;
      }
      if (activeCategoryId === "culture") return /museum|temple|history|art|theatre|gallery|church|synagogue|mosque/i.test(`${p.category} ${p.name}`);
      if (activeCategoryId === "nature") return /park|garden|nature|viewpoint|beach|reserve|hiking|outdoor/i.test(`${p.category} ${p.name}`);
      if (activeCategoryId === "things") return /do|activity|tour|experience|event|festival|market|show|zoo|aquarium|stadium/i.test(`${p.category} ${p.name}`);
      return true;
    });
  }, [places, query, activeCategoryId, selectedIds, isGoodWeather, priceFilter]);

  const filteredDestinations = useMemo(() => {
    return destinations.filter((destination) => {
      if (!query) return true;
      return `${destination.name} ${destination.country}`.toLowerCase().includes(query.toLowerCase());
    });
  }, [destinations, query]);

  const isDestMode = activeCategoryId === "destinations";
  const isIntelMode = activeCategoryId === "intel";
  const isWeatherMode = activeCategoryId === "weather";
  
  const activePlace = useMemo(() => places.find((p) => p.id === selectedPlaceId), [places, selectedPlaceId]);
  const activeDestination = useMemo(() => destinations.find((d) => d.id === selectedDestinationId), [destinations, selectedDestinationId]);
  const activeEvent = useMemo(() => liveEvents.find((e) => e.id === selectedEventId), [liveEvents, selectedEventId]);

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

  // After creating a trip we kick off place discovery in the background, so the
  // first Discover render can land before places are written. Poll a couple of
  // times to pick them up instead of leaving the user staring at an empty list.
  // Each refresh re-runs the heavy server render, so keep attempts low and stop
  // the moment any places arrive (places.length flips this to false).
  const placesWarmingUp =
    Boolean(trip?.destination) &&
    (places.length === 0 || destinations.length === 0) &&
    autoRefreshCount < 2;

  useEffect(() => {
    if (!placesWarmingUp) return;
    const timer = setTimeout(() => {
      router.refresh();
      setAutoRefreshCount((count) => count + 1);
    }, 8000);
    return () => clearTimeout(timer);
  }, [placesWarmingUp, router]);

  const hasNoDataYet = Boolean(trip) && !intelligence && places.length === 0 && destinations.length === 0;

  return (
    <div className="flex h-full w-full overflow-hidden flex-col lg:flex-row bg-background">
      <div className={cn("contents", showDetail && "hidden lg:contents")}>
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
            destination={trip?.destination}
          />
        ) : activeCategoryId === "community" ? (
          <CommunityView
            isFetching={isFetchingCommunity}
            notConnected={communityNotConnected}
            items={communityItems}
            focus={communityFocus}
            onChangeFocus={setCommunityFocus}
            destination={trip?.destination ?? ""}
          />
        ) : isWeatherMode ? (
          todayWeather ? (
            <WeatherView
              todayWeather={todayWeather}
              isGoodWeather={Boolean(isGoodWeather)}
              filteredPlaces={filteredPlaces}
              onSelectPlace={handleSelectPlace}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center opacity-40">
              <CloudSun size={40} strokeWidth={1} className="mb-4 text-muted" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Weather data unavailable</p>
              <p className="mt-2 text-xs text-muted">No destination set for this trip yet.</p>
            </div>
          )
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
            hasNoDataYet={hasNoDataYet || (placesWarmingUp && !isDestMode)}
            isPending={isPending}
            onRefreshPlaces={handleRefreshPlaces}
            onRefreshAI={handleRefreshAI}
            showPriceFilter={activeCategoryId === "food"}
            priceFilter={priceFilter}
            onPriceFilterChange={setPriceFilter}
            topBanner={
              activeCategoryId === "things" && trip?.destination ? (
                <div className="shrink-0 border-b border-border bg-surface px-4 py-3">
                  <p className="text-[10px] font-bold text-muted leading-relaxed">
                    These are sights and experiences from your places. To book guided tours and tickets:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      { label: "GetYourGuide", href: `https://www.getyourguide.com/s/?q=${encodeURIComponent(trip.destination)}` },
                      { label: "Viator", href: `https://www.viator.com/search/${encodeURIComponent(trip.destination)}` },
                      { label: "Klook", href: `https://www.klook.com/en-US/search/?query=${encodeURIComponent(trip.destination)}` },
                    ].map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-muted hover:text-foreground hover:border-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null
            }
          />
        )}
      </div>

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
