"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  RefreshCw, 
  Sparkles, 
  MapPin, 
  Star, 
  Utensils, 
  Church, 
  ExternalLink,
  PlusCircle,
  XCircle,
  Search,
  Compass,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Info,
  Globe,
  History,
  Navigation,
  ChevronDown,
  Calendar,
  CheckCircle2,
  LucideIcon,
  CloudSun,
  CloudRain,
  Wind,
  Plane,
  Bed
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { 
  addPlaceToItinerary, 
  refreshDestinationsFromAi, 
  refreshPlacesFromProvider, 
  removeSelectedPlace, 
  planDestination,
  addSavedPlaceToDay,
  fetchLiveEvents
} from "@/app/actions";
import { imageForPlace } from "@/lib/travel/media";
import type { PlaceRecommendation, TripDraft, DestinationRecommendation } from "@/lib/types/travel";
import type { WeatherSummary } from "@/lib/api/weatherService";
import type { LiveEvent } from "@/lib/api/eventsService";
import { WeatherIcon } from "./weather-icon";

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
  const isEventsMode = activeCategoryId === "events";
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
      {/* 1. Category Rail */}
      <aside className="flex w-full shrink-0 flex-col border-b border-border bg-surface lg:w-[200px] lg:border-b-0 lg:border-r">
        <div className="hidden lg:flex p-4 border-b border-border bg-background items-center justify-between">
           <span className="text-[10px] font-black uppercase tracking-widest text-muted">Field Guide</span>
           {todayWeather && (
             <div className="flex items-center gap-1.5 rounded-full bg-foreground/5 px-2 py-0.5" title={`${todayWeather.label}, ${todayWeather.maxC}°`}>
                <WeatherIcon code={todayWeather.weatherCode} size={10} className="text-foreground" />
                <span className="text-[9px] font-black">{todayWeather.maxC}°</span>
             </div>
           )}
        </div>
        <nav className="flex gap-1 overflow-x-auto p-2 no-scrollbar scrollbar-hide lg:flex-1 lg:flex-col lg:overflow-x-visible">
           {categories.map((cat) => (
             <button
                key={cat.id}
                onClick={() => { updateUrl({ category: cat.id, id: null }); setShowDetail(false); }}
                className={cn(
                  "flex items-center gap-3 shrink-0 rounded-md px-3 py-2 text-xs font-bold transition-all lg:w-full border-l-2 lg:py-2.5",
                  activeCategoryId === cat.id 
                    ? "bg-surface-2 text-foreground border-foreground shadow-sm" 
                    : "text-muted-foreground border-transparent hover:bg-surface-2/30 hover:border-border"
                )}
             >
                <cat.icon size={14} className={cn(activeCategoryId === cat.id ? "text-foreground" : "text-muted-foreground")} />
                <span className="whitespace-nowrap">{cat.label}</span>
             </button>
           ))}
        </nav>
        <div className="hidden lg:block p-4 space-y-2 border-t border-border">
           <button 
             onClick={handleRefreshPlaces}
             disabled={isPending}
             className="flex w-full items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors disabled:opacity-50"
           >
              {isPending ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />} Refresh Places
           </button>
           <button 
             onClick={handleRefreshAI}
             disabled={isPending}
             className="flex w-full items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors disabled:opacity-50"
           >
              {isPending ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Get AI Ideas
           </button>
        </div>
      </aside>

      {/* 2. Content Pane */}
      <section className={cn(
        "flex w-full shrink-0 flex-col border-r border-border bg-background lg:w-[350px] transition-all",
        showDetail && "hidden lg:flex"
      )}>
        {isIntelMode ? (
           <div className="flex-1 overflow-y-auto p-6 space-y-10 scrollbar-hide">
              <header>
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted">Sector Intelligence</span>
                 <h2 className="mt-2 text-2xl font-black uppercase tracking-tighter text-foreground">{trip?.destination || "Unknown Sector"}</h2>
              </header>

              {intelligence ? (
                <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-500">
                   <IntelSection icon={Globe} title="Overview" content={intelligence.overview} />
                   
                   <section>
                      <div className="flex items-center gap-3 mb-4 text-[10px] font-black uppercase tracking-widest text-muted">
                         <Navigation size={14} className="text-foreground" />
                         Neighborhoods
                      </div>
                      <div className="flex flex-wrap gap-2">
                         {intelligence.neighborhoods.length > 0 ? (
                           intelligence.neighborhoods.map((n, i) => (
                             <span key={i} className="rounded-md border border-border bg-surface px-3 py-1 text-[10px] font-bold uppercase tracking-tight">{n}</span>
                           ))
                         ) : (
                           <span className="text-[10px] font-bold text-muted uppercase">Intelligence pending for this sector.</span>
                         )}
                      </div>
                   </section>

                   <IntelSection icon={Star} title="Culture" content={intelligence.culture} />
                   <IntelSection icon={History} title="Background" content={intelligence.history} />
                   
                   {intelligence.practicalNotes.length > 0 && (
                     <section className="space-y-6">
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted">
                           <CheckCircle2 size={14} className="text-foreground" />
                           Tactical Notes
                        </div>
                        <div className="space-y-4">
                           {intelligence.practicalNotes.map((note, i) => (
                             <div key={i} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-tight text-foreground mb-1">
                                   {note.split(":")[0]}
                                </p>
                                <p className="text-[11px] font-medium leading-relaxed text-muted-2 uppercase tracking-wide">
                                   {note.split(":").slice(1).join(":").trim()}
                                </p>
                             </div>
                           ))}
                        </div>
                     </section>
                   )}
                   
                   <div className="rounded-xl bg-foreground p-5 text-background shadow-xl">
                      <Info size={18} className="opacity-50 mb-4" />
                      <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">Intelligence source verified via {intelligence.source} regional protocols.</p>
                   </div>
                </div>
              ) : (
                <div className="py-20 text-center">
                   <div className="relative mx-auto mb-6 size-12">
                      <Loader2 size={48} className={cn("text-muted opacity-20", isPending && "animate-spin opacity-100")} />
                      {!isPending && <Info size={24} className="absolute inset-0 m-auto text-muted" />}
                   </div>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                     {isPending ? "Parsing sector intelligence..." : "No local intelligence detected"}
                   </p>
                   <button 
                     onClick={handleRefreshPlaces}
                     disabled={isPending}
                     className="mt-6 inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-6 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-surface-2 transition-all disabled:opacity-50"
                   >
                      {isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                      Scan Sector
                   </button>
                </div>
              )}
           </div>
        ) : activeCategoryId === "events" ? (
           <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
              <header className="flex items-center justify-between border-b border-border pb-6">
                 <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted">Temporal Intelligence</span>
                    <h2 className="mt-2 text-2xl font-black uppercase tracking-tighter text-foreground">Live Sector Events</h2>
                 </div>
                 {isFetchingEvents && (
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
                     <Loader2 size={12} className="animate-spin" />
                     Scanning Sector
                   </div>
                 )}
              </header>

              <div className="flex flex-col gap-3">
                 {liveEvents.map((event) => (
                   <button 
                      key={event.id}
                      onClick={() => handleSelectEvent(event.id)}
                      className={cn(
                        "flex items-center gap-4 rounded-xl border p-3 text-left transition-all hover:bg-surface-2",
                        selectedEventId === event.id 
                          ? "bg-surface-2 border-foreground ring-1 ring-foreground" 
                          : "bg-background border-border"
                      )}
                   >
                      <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted relative">
                         {event.thumbnail ? (
                           <Image 
                             src={event.thumbnail} 
                             alt={event.name} 
                             fill 
                             className="object-cover" 
                           />
                         ) : (
                           <div className="grid h-full place-items-center opacity-20"><Calendar size={20} /></div>
                         )}
                      </div>
                      <div className="min-w-0 flex-1">
                         <h4 className="truncate text-sm font-black uppercase tracking-tight text-foreground">{event.name}</h4>
                         <div className="mt-1 flex items-center gap-3">
                           <span className="truncate text-[10px] font-bold text-muted uppercase tracking-widest">{event.date}</span>
                           <span className="text-[10px] font-black text-muted/40">•</span>
                           <span className="truncate text-[9px] font-black text-muted-foreground uppercase">{event.venue}</span>
                         </div>
                      </div>
                      <ChevronRight size={14} className={cn("shrink-0 transition-transform", selectedEventId === event.id ? "text-foreground translate-x-1" : "text-muted/40")} />
                   </button>
                 ))}

                 {!isFetchingEvents && liveEvents.length === 0 && (
                   <div className="col-span-full py-20 text-center opacity-40">
                      <Calendar size={48} className="mx-auto mb-4" strokeWidth={1} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted">No tactical events identified for this window</p>
                   </div>
                 )}
              </div>
           </div>
        ) : isWeatherMode ? (
           <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
              <header>
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted">Meteorological Readiness</span>
                 <h2 className="mt-2 text-2xl font-black uppercase tracking-tighter text-foreground">Tactical Weather</h2>
              </header>

              {todayWeather ? (
                <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
                   <div className="rounded-2xl border-2 border-foreground bg-background p-6 shadow-xl">
                      <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-3">
                            <div className="grid size-10 place-items-center rounded-lg bg-foreground text-background">
                               <WeatherIcon code={todayWeather.weatherCode} size={20} />
                            </div>
                            <div>
                               <p className="text-[9px] font-black uppercase tracking-widest text-muted">Current Sector</p>
                               <p className="text-lg font-black uppercase tracking-tight text-foreground">{todayWeather.label}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-3xl font-black tracking-tighter text-foreground">{todayWeather.maxC}°</p>
                            <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Low: {todayWeather.minC}°</p>
                         </div>
                      </div>

                      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted">
                         <span className="flex items-center gap-1.5 text-foreground"><CloudRain size={12} className="text-foreground" /> {todayWeather.rainChance}% Rain</span>
                         <span className="flex items-center gap-1.5 text-foreground"><Wind size={12} className="text-foreground" /> {todayWeather.windSpeedKmh}kmh Wind</span>
                      </div>
                   </div>

                   <section>
                      <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Readiness Assessment</h3>
                      <div className={cn(
                        "rounded-xl border-2 p-5 shadow-sm",
                        isGoodWeather ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500" : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-500"
                      )}>
                         <p className="text-[11px] font-black uppercase tracking-tight leading-relaxed">
                            {isGoodWeather 
                              ? "Optimal conditions for outdoor deployment. Prioritizing parks, viewpoints, and open-air landmarks."
                              : "Sub-optimal weather detected. Prioritizing indoor tactical points: museums, cafes, and shopping sectors."}
                         </p>
                      </div>
                   </section>

                   <section className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Recommended for Today</h3>
                      <div className="divide-y divide-border/50">
                         {filteredPlaces.slice(0, 10).map((place) => (
                           <button
                              key={place.id}
                              onClick={() => handleSelectPlace(place.id)}
                              className="flex w-full items-center gap-3 py-3 text-left hover:bg-surface transition-colors group"
                           >
                              <div className="size-8 shrink-0 overflow-hidden rounded-md bg-muted grayscale-[0.5] group-hover:grayscale-0 transition-all">
                                 <Image 
                                   src={imageForPlace(place)} 
                                   alt={place.name} 
                                   width={32} 
                                   height={32} 
                                   className="h-full w-full object-cover" 
                                   unoptimized
                                 />
                              </div>
                              <div className="min-w-0 flex-1">
                                 <h4 className="truncate text-xs font-bold uppercase tracking-tight leading-none mb-1">{place.name}</h4>
                                 <p className="truncate text-[9px] font-black uppercase tracking-widest text-muted">{place.category}</p>
                              </div>
                              <ChevronRight size={12} className="text-muted opacity-0 group-hover:opacity-100 transition-all" />
                           </button>
                         ))}
                      </div>
                   </section>
                </div>
              ) : (
                <div className="py-20 text-center opacity-40">
                   <CloudSun size={48} className="mx-auto mb-4" strokeWidth={1} />
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted">Telemetry synchronization pending</p>
                </div>
              )}
           </div>
        ) : (
           <>
              <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
                 <div className="relative flex-1 mr-4">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input 
                      placeholder="Search coordinates..." 
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className="h-7 w-full rounded-md border border-border bg-surface pl-8 pr-3 text-[11px] focus:border-foreground focus:ring-0"
                    />
                 </div>
                 <span className="text-[10px] font-bold text-muted">{isDestMode ? filteredDestinations.length : filteredPlaces.length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto divide-y divide-border/50 scrollbar-hide">
                 {hasNoDataYet && (
                   <div className="p-8 text-center">
                     <Loader2 size={32} className="mx-auto mb-4 animate-spin text-muted" strokeWidth={1} />
                     <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                       Preparing destination ideas and live places
                     </p>
                     <p className="mt-3 text-xs leading-5 text-muted">
                       Discovery is still warming up for this trip. Retry if provider data takes longer than expected.
                     </p>
                     <button
                       onClick={handleRefreshPlaces}
                       disabled={isPending}
                       className="mt-5 inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-4 text-[10px] font-black uppercase tracking-widest text-foreground transition-colors hover:bg-surface-2 disabled:opacity-50"
                     >
                       {isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                       Retry places
                     </button>
                   </div>
                 )}
                 {isDestMode ? (
                   filteredDestinations.map((dest) => (
                     <button
                        key={dest.id}
                        onClick={() => handleSelectDest(dest.id)}
                        className={cn(
                          "flex w-full flex-col gap-1 p-4 text-left transition-all",
                          selectedDestinationId === dest.id ? "bg-surface-2 ring-1 ring-inset ring-border" : "hover:bg-surface"
                        )}
                     >
                        <h4 className={cn("truncate text-xs font-bold uppercase tracking-tight", selectedDestinationId === dest.id ? "text-foreground" : "text-muted-2")}>{dest.name}</h4>
                        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">{dest.country}</p>
                     </button>
                   ))
                 ) : (
                   filteredPlaces.map((place) => (
                     <button
                        key={place.id}
                        onClick={() => handleSelectPlace(place.id)}
                        className={cn(
                          "flex w-full items-center gap-3 p-3 text-left transition-all",
                          selectedPlaceId === place.id ? "bg-surface-2 ring-1 ring-inset ring-border" : "hover:bg-surface"
                        )}
                     >
                        <Image
                          src={imageForPlace(place)}
                          alt={place.name}
                          width={40}
                          height={40}
                          className="size-10 rounded-md object-cover grayscale-[0.5]"
                          unoptimized
                        />
                        <div className="min-w-0 flex-1">
                           <div className="flex items-center justify-between gap-2">
                              <h4 className={cn("truncate text-xs font-bold", selectedPlaceId === place.id ? "text-foreground" : "text-muted-2")}>
                                {place.name}
                              </h4>
                              {selectedIds.has(place.id) && <div className="size-1.5 shrink-0 rounded-full bg-foreground" />}
                           </div>
                           <div className="mt-1.5 flex min-w-0 items-center gap-2">
                             <p className="truncate text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">{place.category}</p>
                             <span className={cn(
                               "shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest",
                               getProviderStyles(place.source?.provider)
                             )}>
                               {formatProvider(place.source?.provider)}
                             </span>
                           </div>
                        </div>
                     </button>
                   ))
                 )}
                 {!hasNoDataYet && ((isDestMode && filteredDestinations.length === 0) || (!isDestMode && filteredPlaces.length === 0)) && (
                   <div className="p-8 text-center">
                      <Compass size={32} className="mx-auto mb-4 text-muted" strokeWidth={1} />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                        {isDestMode ? "No destination ideas yet" : "No places in this view"}
                      </p>
                      <button 
                        onClick={isDestMode ? handleRefreshAI : handleRefreshPlaces}
                        disabled={isPending}
                        className="mt-5 inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-4 text-[10px] font-black uppercase tracking-widest text-foreground transition-colors hover:bg-surface-2 disabled:opacity-50"
                      >
                        {isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        Retry
                      </button>
                   </div>
                 )}
              </div>
           </>
        )}
      </section>

      {/* 3. Detail Stage */}
      <main className={cn(
        "relative flex-1 overflow-y-auto bg-background p-6 lg:p-12 xl:p-16 scrollbar-hide",
        !showDetail && "hidden lg:block"
      )}>
        <button 
           onClick={() => setShowDetail(false)}
           className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground lg:hidden"
        >
           <ChevronLeft size={14} /> Back to tactical list
        </button>

        {status && (
          <div
            className={cn(
              "mb-6 rounded-lg border px-4 py-3 text-[10px] font-black uppercase tracking-widest",
              status.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
              status.tone === "error" && "border-rose-200 bg-rose-50 text-rose-700",
              status.tone === "info" && "border-border bg-surface text-muted",
            )}
          >
            {status.message}
          </div>
        )}

        <AnimatePresence mode="wait">
          {isDestMode ? (
            activeDestination ? (
              <motion.div
                key={activeDestination.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mx-auto max-w-2xl"
              >
                <header className="mb-12 border-b border-border pb-12">
                   <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8">
                      <div className="min-w-0">
                         <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-muted border border-border">
                            Destination Proposal
                         </span>
                         <div className="mt-3 flex flex-wrap gap-2">
                           <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-muted">
                             {activeDestination.source.classification === "ai" ? "AI estimate" : activeDestination.source.provider}
                           </span>
                           {activeDestination.source.classification === "ai" && (
                             <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-muted">
                               Not live provider data
                             </span>
                           )}
                           {isCommittedDestination && (
                             <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-700">
                               Committed
                             </span>
                           )}
                         </div>
                         <h1 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-foreground leading-[0.95]">{activeDestination.name}</h1>
                         <p className="mt-4 text-[10px] font-bold text-muted uppercase tracking-[0.3em]">{activeDestination.country}</p>
                      </div>
                      <form action={handleCommitDest}>
                         <input type="hidden" name="destinationId" value={activeDestination.id} />
                         <button 
                           disabled={isPending}
                           className="flex h-12 items-center gap-2 rounded-lg bg-foreground px-8 text-[10px] font-black uppercase tracking-widest text-background shadow-2xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50"
                         >
                            {isPending ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />} Commit Destination
                         </button>
                      </form>
                   </div>
                </header>

                <div className="space-y-12">
                   <section>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6">Alignment Logic</h3>
                      <p className="text-xl sm:text-2xl font-black leading-[1.2] text-foreground tracking-tight max-w-[50ch]">{activeDestination.whyItMatches}</p>
                   </section>

                   {activeDestination.source.classification === "ai" && (
                     <section className="rounded-2xl border-2 border-border bg-surface p-8 shadow-inner">
                       <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Planning Assumptions</h3>
                       <div className="space-y-4 text-[10px] font-black uppercase tracking-widest text-muted-2">
                         <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                            <CloudSun size={14} className="text-foreground" />
                            <span>Weather: {activeDestination.weatherSummary}</span>
                         </div>
                         <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                            <Plane size={14} className="text-foreground" />
                            <span>Flight: {activeDestination.flightEstimate}</span>
                         </div>
                         <div className="flex items-center gap-3">
                            <Bed size={14} className="text-foreground" />
                            <span>Hotel: {activeDestination.hotelEstimate}</span>
                         </div>
                       </div>
                     </section>
                   )}
                   
                   <div className="grid gap-6 sm:grid-cols-2">
                      <section className="rounded-2xl border-2 border-border bg-surface p-8 shadow-inner transition-all hover:border-emerald-500/30 group">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6 text-emerald-600">Strategic Advantages</h3>
                         <p className="text-[11px] font-black leading-relaxed text-muted-2 uppercase tracking-wide group-hover:text-foreground transition-colors">{activeDestination.pros}</p>
                      </section>
                      <section className="rounded-2xl border-2 border-border bg-surface p-8 shadow-inner transition-all hover:border-rose-500/30 group">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6 text-rose-600">Known Constraints</h3>
                         <p className="text-[11px] font-black leading-relaxed text-muted-2 uppercase tracking-wide group-hover:text-foreground transition-colors">{activeDestination.cons}</p>
                      </section>
                   </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
                 <MapPin size={48} strokeWidth={1} />
                 <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em]">Select a destination to review</p>
              </div>
            )
          ) : isEventsMode ? (
            activeEvent ? (
              <motion.div
                key={activeEvent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-8 space-y-10"
              >
                <header>
                   <div className="flex items-center gap-3 mb-4">
                      <span className="rounded-full bg-foreground px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-background">LIVE EVENT</span>
                   </div>
                   <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground leading-none">{activeEvent.name}</h2>
                   <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted leading-relaxed">{activeEvent.date}</p>
                </header>

                {activeEvent.thumbnail && (
                   <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border shadow-sm relative">
                      <Image 
                        src={activeEvent.thumbnail} 
                        alt={activeEvent.name} 
                        fill 
                        className="object-cover" 
                      />
                   </div>
                )}

                <div className="space-y-8">
                   <section>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4">Venue Logistics</h3>
                      <div className="rounded-xl border border-border bg-surface-2 p-5 space-y-3">
                         <div className="flex items-center gap-3">
                            <MapPin size={14} className="text-foreground" />
                            <span className="text-xs font-bold text-foreground">{activeEvent.venue}</span>
                         </div>
                         {activeEvent.address && <p className="text-[9px] font-black text-muted uppercase tracking-widest ml-7">{activeEvent.address}</p>}
                      </div>
                   </section>

                   {activeEvent.description && (
                     <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4">Operational Brief</h3>
                        <p className="text-sm font-medium leading-relaxed text-muted-foreground uppercase tracking-tight line-clamp-[10]">{activeEvent.description}</p>
                     </section>
                   )}

                   <div className="pt-8 border-t border-border">
                      <a 
                        href={activeEvent.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-foreground text-[10px] font-black uppercase tracking-widest text-background shadow-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95"
                      >
                         Get Credentials <ExternalLink size={14} />
                      </a>
                   </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
                 <Calendar size={48} strokeWidth={1} />
                 <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em]">Select an event to review details</p>
              </div>
            )
          ) : (
            activePlace ? (
              <motion.div
                key={activePlace.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mx-auto max-w-2xl"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border shadow-sm grayscale-[0.2]">
                  <Image
                    src={imageForPlace(activePlace)}
                    alt={activePlace.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 672px"
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                <header className="mt-12 border-b border-border pb-12 flex flex-col sm:flex-row sm:items-start justify-between gap-8">
                   <div className="min-w-0">
                      <div className="flex items-center gap-3">
                         <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-muted border border-border">
                            {activePlace.category}
                         </span>
                         {activePlace.isHiddenGem && (
                           <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase">
                             <Star size={10} fill="currentColor" /> Hidden Gem
                           </span>
                         )}
                      </div>
                      <h1 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-foreground leading-[0.95]">{activePlace.name}</h1>
                      <p className="mt-4 flex items-center gap-2 text-[10px] text-muted font-bold uppercase tracking-[0.3em]">
                         <MapPin size={12} className="text-foreground" /> {activePlace.location}
                      </p>
                   </div>
                   
                   <div className="flex flex-col gap-2 shrink-0 sm:w-48">
                      <form action={handlePlaceAction} className="w-full">
                         <input type="hidden" name="placeId" value={activePlace.id} />
                         <button
                           className={cn(
                             "flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-[9px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95",
                             isSelected 
                               ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50 dark:hover:bg-rose-900/30" 
                               : "bg-foreground text-background hover:bg-zinc-800 dark:hover:bg-zinc-200"
                           )}
                         >
                           {isSelected ? <XCircle size={14} /> : <PlusCircle size={14} />}
                           {isSelected ? "Drop from Stack" : "Add to Stack"}
                         </button>
                      </form>

                      {isSelected && (
                        <div className="relative w-full">
                          {usedPlaceRecommendationIds.has(activePlace.id) ? (
                            <div className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50">
                               <CheckCircle2 size={14} /> In Itinerary
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => setChooserOpen(!chooserOpen)}
                                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-[9px] font-black uppercase tracking-widest text-foreground shadow-sm hover:bg-background transition-all"
                              >
                                <Calendar size={14} /> Use in Timeline <ChevronDown size={12} className={cn("transition-transform", chooserOpen && "rotate-180")} />
                              </button>

                              <AnimatePresence>
                                {chooserOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 z-50 mt-2 w-full min-w-[240px] overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
                                  >
                                    {itineraryDays.length > 0 ? (
                                      <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide">
                                        {itineraryDays.map((day) => (
                                          <div key={day.id} className="mb-2 last:mb-0">
                                            <p className="px-2 py-1 text-[8px] font-black uppercase tracking-widest text-muted">{day.date} — {day.theme}</p>
                                            <div className="grid grid-cols-3 gap-1 mt-1">
                                              {["morning", "afternoon", "evening"].map((segment) => (
                                                <button
                                                  key={segment}
                                                  onClick={() => handleUseInItinerary(day.id, segment)}
                                                  className="flex h-8 items-center justify-center rounded-md border border-border bg-surface text-[8px] font-black uppercase tracking-tighter text-muted hover:bg-foreground hover:text-background hover:border-foreground transition-all"
                                                >
                                                  {segment}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="p-6 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Generate itinerary first</p>
                                        <button 
                                          onClick={() => router.push("/itinerary")}
                                          className="mt-3 text-[9px] font-black uppercase tracking-widest text-foreground underline underline-offset-4"
                                        >
                                          Go to Timeline
                                        </button>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </>
                          )}
                        </div>
                      )}
                   </div>
                </header>

                <div className="mt-12 grid gap-16 lg:grid-cols-[1fr_200px]">
                   <div className="space-y-12">
                      <section>
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6">Brief</h3>
                         <p className="text-xl font-medium leading-relaxed text-foreground tracking-tight">
                            {activePlace.description || "Curated intelligence for this sector. High alignment with trip profile."}
                         </p>
                      </section>
                      
                      <section className="rounded-xl bg-surface p-8 border border-border shadow-inner">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6">Discovery Source</h3>
                         <p className="text-sm font-bold leading-relaxed text-muted-2 uppercase tracking-wide">
                            {activePlace.whyRecommended || "Standard recommendation based on location popularity and category relevance."}
                         </p>
                         <div className="mt-4 flex flex-wrap gap-2">
                           <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-muted">
                             Source: {formatProvider(activePlace.source?.provider)}
                           </span>
                           <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-muted">
                             {activePlace.source?.classification === "provider" ? "Provider data" : activePlace.source?.classification ?? "Unknown"}
                           </span>
                         </div>
                      </section>
                   </div>

                   <div className="space-y-8">
                      <section>
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6">Telemetry</h3>
                         <div className="space-y-4">
                            <MetaItem label="Rating Index" value={activePlace.rating?.toString() || "Optimal"} />
                            <MetaItem label="Cost Weight" value={activePlace.costLevel || "Standard"} />
                            <MetaItem label="Intensity" value="Moderate" />
                         </div>
                      </section>
                      
                      <button className="w-full h-10 rounded-md border border-border bg-background text-[9px] font-black uppercase tracking-widest text-muted hover:text-foreground hover:border-foreground transition-all" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activePlace.name)}`, "_blank")}>
                         <ExternalLink size={10} className="inline mr-2" /> Google Maps
                      </button>
                   </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
                 <Compass size={48} strokeWidth={1} />
                 <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em]">Select an entity to review details</p>
              </div>
            )
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function formatProvider(provider?: string) {
  switch (provider) {
    case "google":
    case "google-places":
      return "Google";
    case "osm":
      return "OSM";
    case "wikivoyage":
      return "Wiki";
    case "wikidata":
      return "Data";
    case "openai":
      return "AI";
    default:
      return provider || "Source";
  }
}

function getProviderStyles(provider?: string) {
  switch (provider) {
    case "google":
    case "google-places":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "osm":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "wikivoyage":
    case "wikidata":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "openai":
      return "border-purple-200 bg-purple-50 text-purple-700";
    default:
      return "border-border bg-surface text-muted-foreground";
  }
}

function IntelSection({ icon: Icon, title, content }: { icon: LucideIcon, title: string, content: string | null }) {
  if (!content) return null;
  return (
    <section>
       <div className="flex items-center gap-3 mb-4 text-[10px] font-black uppercase tracking-widest text-muted">
          <Icon size={14} className="text-foreground" />
          {title}
       </div>
       <p className="text-sm font-medium leading-relaxed text-muted-2 uppercase tracking-wide">{content}</p>
    </section>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-2">
       <span className="text-[9px] font-medium text-muted uppercase tracking-widest">{label}</span>
       <span className="text-[10px] font-black text-foreground uppercase">{value}</span>
    </div>
  );
}
