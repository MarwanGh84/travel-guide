"use client";

import { useCallback, useEffect, useRef, useState, type MouseEventHandler } from "react";
import {
  Sparkles,
  Trash2,
  Clock,
  MapPin,
  Utensils,
  Train,
  ShieldCheck,
  Loader2,
  CalendarDays,
  LucideIcon,
  ChevronRight,
  CloudRain,
  CloudSun,
  Bookmark,
  AlertTriangle,
  Edit3,
  RefreshCw,
  Save,
  X,
  Download,
  Navigation,
  CheckCircle2,
  Printer,
  Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatCurrency, normalizeName } from "@/lib/utils";
import type { ItineraryDay, PlaceRecommendation, TripDraft } from "@/lib/types/travel";
import type { WeatherSummary } from "@/lib/api/weatherService";
import type { ItineraryWeatherImpact } from "@/lib/travel/weather-intelligence";
import { Textarea } from "@/components/ui/input";
import { 
  clearItinerary, 
  approveItinerary, 
  reopenItinerary, 
  shuffleItineraryDays,
  deleteItineraryItem,
  updateItineraryItem
} from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WeatherIcon } from "./weather-icon";
import { findShuffleCandidate } from "@/lib/travel/weather-intelligence";

type ItineraryWorkspaceProps = {
  trip: TripDraft | null;
  initialDays: ItineraryDay[];
  selectedPlaces: PlaceRecommendation[];
  allPlaces: PlaceRecommendation[];
  shouldAutoGenerate: boolean;
  weather?: WeatherSummary | null;
  weatherImpact?: ItineraryWeatherImpact[];
};

export function ItineraryWorkspace({ initialDays, selectedPlaces, allPlaces, shouldAutoGenerate, trip, weather, weatherImpact = [] }: ItineraryWorkspaceProps) {
  const router = useRouter();
  const [days, setDays] = useState<ItineraryDay[]>(initialDays);
  const [activeDayId, setActiveDayId] = useState(initialDays[0]?.id ?? "");
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const [showDetail, setShowDetail] = useState(Boolean(initialDays[0]));
  const [editMode, setEditMode] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceRecommendation | null>(null);
  const [selectedPointName, setSelectedPointName] = useState("");
  const [pendingDeleteDayId, setPendingDeleteDayId] = useState<string | null>(null);
  const [pendingClear, setPendingClear] = useState(false);
  const [showShuffleDialog, setShowShuffleDialog] = useState(false);
  const autoGenerateStarted = useRef(false);

  const activeIndex = Math.max(0, days.findIndex((day) => day.id === activeDayId));
  const activeDay = days[activeIndex] ?? days[0];
  const activeWeatherImpact = weatherImpact.find(i => i.date === activeDay?.date);
  const activeWeather = weather?.daily.find(d => d.date === activeDay?.date);
  const shuffleOption = activeDay ? findShuffleCandidate(activeDay.id, days, weatherImpact) : null;

  const placesByNormalizedName = new Map([...selectedPlaces, ...allPlaces].map((place) => [normalizeName(place.name), place]));
  const placesById = new Map([...selectedPlaces, ...allPlaces].map((place) => [place.id, place]));
  const scheduledPlaces = getScheduledPlaces(activeDay, placesById, placesByNormalizedName);
  const tacticalPoints =
    activeDay?.places?.length
      ? activeDay.places
      : activeDay?.placesIncluded.map((title, index) => ({
          id: `${activeDay.id}-${index}`,
          title,
          timeOfDay: undefined,
          placeRecommendationId: undefined,
          place: undefined,
        })) ?? [];

  const generate = useCallback(async () => {
    setGenerating(true);
    setStatus("Generating optimized journey...");
    const selectedIds = selectedPlaces.map((p) => p.id);
    const response = await fetch("/api/ai/itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ save: true, selectedPlaceIds: selectedIds }),
    });
    const result = await response.json();
    setGenerating(false);
    if (response.ok && result.ok) {
      setDays(result.data);
      setActiveDayId(result.data[0]?.id ?? "");
      setShowDetail(Boolean(result.data[0]));
      setStatus("Itinerary synchronized.");
      setTimeout(() => setStatus(""), 3000);
      return;
    }
    setStatus(result.raw || result.message || "Itinerary generation failed.");
    setTimeout(() => setStatus(""), 5000);
  }, [selectedPlaces]);

  useEffect(() => {
    if (autoGenerateStarted.current || !shouldAutoGenerate) return;
    autoGenerateStarted.current = true;
    void generate();
  }, [generate, shouldAutoGenerate]);

  const initialDaysPayload = JSON.stringify(initialDays);
  const lastDaysPayload = useRef(initialDaysPayload);

  useEffect(() => {
    if (initialDaysPayload !== lastDaysPayload.current) {
      setDays(initialDays);
      lastDaysPayload.current = initialDaysPayload;
      if (!initialDays.find(d => d.id === activeDayId) && initialDays.length > 0) {
        requestAnimationFrame(() => {
          setActiveDayId(initialDays[0].id);
        });
      }
    }
  }, [initialDays, activeDayId, initialDaysPayload]);

  if (!trip) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-8 text-center">
        <div className="max-w-sm space-y-4">
          <CalendarDays size={40} className="mx-auto text-muted" strokeWidth={1.5} />
          <h1 className="text-lg font-black uppercase tracking-tight text-foreground">No active trip</h1>
          <p className="text-sm leading-relaxed text-muted-2">
            Create or select a trip before building an itinerary.
          </p>
          <Link href="/trips" className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-4 text-[10px] font-black uppercase tracking-widest text-background">
            Open trips
          </Link>
        </div>
      </div>
    );
  }

  async function addDay() {
    setBusyAction("add");
    const response = await fetch("/api/itinerary/day", { method: "POST" });
    const result = await response.json();
    setBusyAction("");
    if (response.ok) {
      setDays((current) => [...current, result.data]);
      setActiveDayId(result.data.id);
      setShowDetail(true);
    }
  }

  function deleteDay(id: string) {
    setPendingDeleteDayId(id);
  }

  async function confirmDeleteDay() {
    if (!pendingDeleteDayId) return;
    setBusyAction("delete");
    const response = await fetch(`/api/itinerary/day?id=${encodeURIComponent(pendingDeleteDayId)}`, { method: "DELETE" });
    setBusyAction("");
    if (response.ok) {
      setDays((current) => {
        const next = current.filter((d) => d.id !== pendingDeleteDayId);
        setActiveDayId(next[0]?.id ?? "");
        return next;
      });
      setPendingDeleteDayId(null);
    }
  }

  async function onSaveDay(updated: ItineraryDay) {
    setBusyAction("save");
    // Optimistic Update
    setDays((current) => current.map((d) => (d.id === updated.id ? updated : d)));
    
    const response = await fetch("/api/itinerary/day", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setBusyAction("");
    const result = await response.json();
    if (response.ok) {
      setEditMode(false);
      setStatus("Day updated.");
      setTimeout(() => setStatus(""), 2000);
      return;
    }
    // Revert on failure
    setDays(initialDays);
    setStatus(result.message || "Could not save this itinerary day.");
    setTimeout(() => setStatus(""), 5000);
  }

  const exportJson = () => {
    const data = JSON.stringify({ trip, days }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `itinerary-${trip?.destination || "trip"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectDay = (id: string) => {
    setActiveDayId(id);
    setShowDetail(true);
    setEditMode(false);
    setSelectedPlace(null);
    setSelectedPointName("");
  };

  const handleSelectPoint = (name: string) => {
    const matched = placesByNormalizedName.get(normalizeName(name));
    setSelectedPointName(name);
    if (matched) {
      setSelectedPlace(matched);
      setShowDetail(true);
      setEditMode(false);
      return;
    }
    setSelectedPlace(null);
    setShowDetail(true);
    setEditMode(false);
  };

  const handleExecuteShuffle = async (candidateId?: string) => {
    const targetId = candidateId || shuffleOption?.candidateDayId;
    if (!targetId || !activeDay?.id) return;
    
    setBusyAction("shuffle");
    setStatus("Executing tactical shuffle...");

    // Optimistic Swap
    setDays((current) => {
      const d1Idx = current.findIndex(d => d.id === activeDay.id);
      const d2Idx = current.findIndex(d => d.id === targetId);
      if (d1Idx === -1 || d2Idx === -1) return current;
      
      const next = [...current];
      const d1 = next[d1Idx];
      const d2 = next[d2Idx];
      
      const newTheme1 = d1.theme.replace(/Day \d+/gi, `Day ${d2Idx + 1}`);
      const newTheme2 = d2.theme.replace(/Day \d+/gi, `Day ${d1Idx + 1}`);

      // Swap positions and update dates/themes to match new slots
      next[d1Idx] = { ...d2, date: d1.date, theme: newTheme2 };
      next[d2Idx] = { ...d1, date: d2.date, theme: newTheme1 };
      
      return next;
    });

    const result = await shuffleItineraryDays(activeDay.id, targetId);
    setBusyAction("");
    if (result.ok) {
       router.refresh();
       setStatus("Itinerary optimized.");
       setTimeout(() => setStatus(""), 3000);
    } else {
       // Revert on failure
       setDays(initialDays);
       setStatus(result.message || "Shuffle failed");
       setTimeout(() => setStatus(""), 5000);
    }
  };

  const handleMitigate = async () => {
    if (!activeDay) return;
    setBusyAction("mitigate");
    setStatus("Deploying weather mitigation strategy...");
    
    const instruction = `URGENT: High weather risk (${activeWeatherImpact?.risk}) detected for this day. 
    Regenerate this day to be 100% INDOOR focused. Replace outdoor viewpoints, parks, or walking tours 
    with museums, indoor galleries, or shopping experiences. Keep the theme relevant but safe.`;
    
    const response = await fetch("/api/ai/adjust-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day: activeDay, instruction, save: true }),
    });
    
    const result = await response.json();
    setBusyAction("");
    
    if (response.ok && result.ok) {
       router.refresh();
       setStatus("Plan mitigated for weather safety.");
       setTimeout(() => setStatus(""), 3000);
    } else {
       setStatus(result.message || "Mitigation failed");
       setTimeout(() => setStatus(""), 5000);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden flex-col lg:flex-row">
      {/* 1. Timeline Pane */}
      <aside className={cn(
        "flex w-full shrink-0 flex-col border-r border-border bg-surface transition-all duration-300 lg:w-[400px]",
        activeDayId ? "h-[180px] lg:h-full" : "h-full"
      )}>
        <div className="flex h-auto min-h-12 shrink-0 flex-col border-b border-border bg-background px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:py-0">
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">TIMELINE</span>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-muted">
                {days.length}
              </span>
            </div>
          </div>
          <div className="flex flex-nowrap items-center gap-1 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
            {trip?.status === "itinerary_approved" ? (
               <div className="flex items-center gap-1 flex-nowrap">
                  <div className="flex h-7 shrink-0 items-center gap-1 rounded-md bg-emerald-50 px-2 text-[8px] font-black uppercase tracking-wider text-emerald-600 ring-1 ring-emerald-200">
                    <ShieldCheck size={10} />
                    <span>Done</span>
                  </div>
                  <form action={reopenItinerary}>
                     <ToolbarButton type="submit" className="h-7 text-[8px] px-2" title="Unlock for editing">Unlock</ToolbarButton>
                  </form>
               </div>
            ) : (
               <form action={approveItinerary}>
                 <ToolbarButton 
                    type="submit" 
                    primary 
                    disabled={days.length === 0 || generating} 
                    className="h-7 text-[8px] px-2"
                    title="Commit itinerary"
                 >
                    Approve
                 </ToolbarButton>
               </form>
            )}

            <ToolbarButton 
               onClick={generate} 
               disabled={generating || trip?.status === "itinerary_approved"} 
               primary={trip?.status !== "itinerary_approved" && days.length === 0} 
               className="h-7 text-[8px] px-2"
               title="Build with AI"
            >
              Build
            </ToolbarButton>
            
            <ToolbarButton
               onClick={() => setPendingClear(true)}
               disabled={days.length === 0}
               className="h-7 text-[8px] px-2"
               title="Clear"
             >
                Clear
             </ToolbarButton>

            <ToolbarButton onClick={addDay} disabled={Boolean(busyAction)} className="h-7 text-[8px] px-2" title="Add Day">
               + Day
            </ToolbarButton>

            <Link href="/trip-pack">
              <ToolbarButton className="h-7 text-[8px] px-2" title="Print"><Printer size={10} /></ToolbarButton>
            </Link>
            
            <ToolbarButton onClick={exportJson} className="h-7 text-[8px] px-2" title="JSON"><Download size={10} /></ToolbarButton>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/50 bg-background">
          <AnimatePresence initial={false}>
            {days.map((day, idx) => {
              const impact = weatherImpact.find(i => i.date === day.date);
              const dailyWeather = weather?.daily.find(d => d.date === day.date);
              return (
                <motion.div key={day.id} layout transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                  <TimelineDay 
                    day={day} 
                    idx={idx} 
                    active={activeDayId === day.id}
                    impact={impact}
                    weather={dailyWeather}
                    onClick={() => handleSelectDay(day.id)}
                    onDelete={() => deleteDay(day.id)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
          {days.length === 0 && !generating && (
            <div className="space-y-3 p-12 text-center">
               <CalendarDays size={32} className="mx-auto mb-4" strokeWidth={1} />
               <p className="text-[10px] font-bold uppercase tracking-widest text-foreground">No itinerary yet</p>
               <p className="text-xs leading-relaxed text-muted">
                 {selectedPlaces.length > 0
                   ? "Generate from your saved places to create a full trip plan."
                   : "No saved places selected. AI can still draft a plan from the active trip profile and available recommendations."}
               </p>
            </div>
          )}
        </div>
      </aside>

      {/* 2. Focused Plan & Intelligence Pane */}
      <main className="relative flex-1 bg-surface-2 overflow-hidden flex flex-col lg:flex-row">
        {/* Active Day Detail */}
        <section className="flex-1 overflow-y-auto bg-background p-6 sm:p-12 lg:p-12 xl:p-16 border-r border-border scrollbar-hide">
           {activeDay ? (
             <div className="max-w-3xl mx-auto space-y-12 sm:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header>
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Active Objective</span>
                      {activeWeather && (
                        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-3 py-1.5 shadow-sm">
                           <WeatherIcon code={activeWeather.weatherCode} className="text-foreground" size={14} />
                           <span className="text-[10px] font-black uppercase tracking-widest">{activeWeather.label}</span>
                           <span className="text-[10px] font-black">{activeWeather.maxC}° / {activeWeather.minC}°</span>
                        </div>
                      )}
                      </div>

                      <h1 className="mt-4 text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter uppercase text-foreground leading-[0.95]">{activeDay.theme}</h1>
                      <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-4 sm:gap-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span className="flex items-center gap-2 border-b border-border pb-1 whitespace-nowrap"><Clock size={14} className="text-foreground" /> {activeDay.date}</span>
                      <span className="flex items-center gap-2 border-b border-border pb-1 whitespace-nowrap"><ShieldCheck size={14} className="text-foreground" /> {formatCurrency(activeDay.estimatedCost)}</span>
                      <div className="flex items-center gap-2 rounded-full border border-emerald-200/50 bg-emerald-500/10 px-2.5 py-1 text-emerald-600 dark:text-emerald-500 shadow-sm whitespace-nowrap">
                         <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                         Weather Sync Active
                      </div>

                      <button
                        onClick={() => setShowShuffleDialog(true)}
                        className="flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1 text-muted hover:text-foreground hover:border-foreground transition-all shadow-sm whitespace-nowrap"
                      >
                         <RefreshCw size={10} /> Optimize Day
                      </button>
                      </div>
                   {activeWeatherImpact && activeWeatherImpact.risk !== "low" && (
                     <div className={cn(
                       "mt-8 flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border-2 p-6 shadow-xl animate-in zoom-in-95 duration-500",
                       activeWeatherImpact.risk === "high" ? "border-rose-500 bg-rose-50" : "border-amber-500 bg-amber-50"
                     )}>
                        <div className={cn(
                          "grid size-12 shrink-0 place-items-center rounded-lg shadow-lg",
                          activeWeatherImpact.risk === "high" ? "bg-rose-600 text-white" : "bg-amber-600 text-white"
                        )}>
                           <AlertTriangle size={24} />
                        </div>
                        <div className="flex-1">
                           <p className={cn(
                             "text-[10px] font-black uppercase tracking-widest mb-1",
                             activeWeatherImpact.risk === "high" ? "text-rose-700" : "text-amber-700"
                           )}>Weather Shield Warning</p>
                           <p className="text-sm font-black uppercase tracking-tight text-foreground">{activeWeatherImpact.warnings.join(" ")}</p>
                           <p className="mt-2 text-[10px] font-bold uppercase text-muted-foreground/80 leading-relaxed italic">“{activeWeatherImpact.suggestion}”</p>
                           
                           {shuffleOption && (
                             <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
                               <button
                                 onClick={() => handleExecuteShuffle()}
                                 disabled={busyAction === "shuffle"}
                                 className="h-10 rounded-lg bg-foreground px-6 text-[10px] font-black uppercase tracking-widest text-background shadow-xl transition-all active:scale-95 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 flex items-center gap-2"
                               >
                                 {busyAction === "shuffle" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                 Execute Tactical Shuffle
                               </button>
                               <p className="text-[9px] font-bold uppercase text-muted-foreground/60 max-w-[200px]">
                                 Suggested swap with indoor focus on <span className="text-foreground">{shuffleOption.candidateTheme}</span>.
                               </p>
                             </div>
                           )}

                        </div>
                        {!shuffleOption && (
                          <button 
                             onClick={handleMitigate}
                             disabled={busyAction === "mitigate"}
                             className={cn(
                               "h-10 rounded-lg px-6 text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-90 flex items-center gap-2",
                               activeWeatherImpact.risk === "high" ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-amber-600 text-white hover:bg-amber-700"
                             )}
                          >
                             {busyAction === "mitigate" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                             Mitigate Plan
                          </button>
                        )}
                     </div>
                   )}
                </header>

                <div className="space-y-10 sm:space-y-12 pb-24">
                   {tacticalPoints.length > 0 && (
                     <section>
                        <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Tactical Points</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                           {tacticalPoints.map((point, i) => {
                             const name = point.title;
                             const linkedPlace =
                               point.place ??
                               (point.placeRecommendationId ? placesById.get(point.placeRecommendationId) : undefined) ??
                               placesByNormalizedName.get(normalizeName(name));
                             return (
                               <div
                                  key={i}
                                  className="group flex items-center gap-2 rounded-xl border-2 border-border bg-background p-2 transition-all duration-300 hover:border-black hover:shadow-xl hover:-translate-y-0.5"
                               >
                                  <button
                                    type="button"
                                    onClick={() => handleSelectPoint(name)}
                                    className="group/btn flex min-w-0 flex-1 items-center justify-between rounded-lg p-2 text-left"
                                  >
                                     <div className="flex min-w-0 items-center gap-3">
                                        <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-muted group-hover/btn:text-foreground transition-colors">
                                           <MapPin size={18} />
                                        </div>
                                        <div className="min-w-0">
                                          <span className="block truncate text-[11px] font-black uppercase tracking-tight leading-none mb-1">{name}</span>
                                          <span className="block truncate text-[8px] font-black uppercase tracking-widest text-muted group-hover/btn:text-muted-foreground transition-colors">
                                            {linkedPlace?.coordinates ? `${linkedPlace.location || "Provider mapped"} · ${linkedPlace.source.provider}` : linkedPlace ? "Provider record" : "AI text only"}
                                          </span>
                                        </div>
                                     </div>
                                     <ChevronRight size={12} className="shrink-0 text-muted transition-transform group-hover/btn:translate-x-1" />
                                  </button>
                                  {linkedPlace?.coordinates && (
                                    <button
                                      type="button"
                                      onClick={() => window.open(buildPlaceDirectionsUrl(linkedPlace), "_blank")}
                                      aria-label={`Navigate to ${linkedPlace.name}`}
                                      title={`Navigate to ${linkedPlace.name}`}
                                      className="grid size-10 shrink-0 place-items-center rounded-lg bg-foreground text-background shadow-lg transition-all active:scale-90 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                                    >
                                      <Navigation size={14} />
                                    </button>
                                  )}
                               </div>
                             );
                           })}
                        </div>
                     </section>
                   )}

                   <PlanNode
                     icon={Clock}
                     label="MORNING"
                     content={activeDay.morningPlan}
                     places={scheduledPlaces.morning}
                     onSelectPlace={handleSelectPoint}
                     setDays={setDays}
                   />
                   <PlanNode
                     icon={Clock}
                     label="AFTERNOON"
                     content={activeDay.afternoonPlan}
                     places={scheduledPlaces.afternoon}
                     onSelectPlace={handleSelectPoint}
                     setDays={setDays}
                   />
                   <PlanNode
                     icon={Clock}
                     label="EVENING"
                     content={activeDay.eveningPlan}
                     places={scheduledPlaces.evening}
                     onSelectPlace={handleSelectPoint}
                     setDays={setDays}
                   />
                </div>
             </div>
           ) : (
             <div className="flex h-full items-center justify-center p-12 text-center">
                <div className="space-y-4">
                  <CalendarDays size={64} className="mx-auto text-muted" strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted">Generate or add a day to begin</p>
                </div>
             </div>
           )}
        </section>

        {/* Retractable Detail & Intelligence Pane */}
        <aside
          className={cn(
            "fixed inset-y-0 right-0 z-40 border-l border-border bg-surface transition-all duration-300 shadow-2xl flex flex-col lg:relative lg:inset-auto lg:shrink-0 lg:z-20",
            showDetail ? "w-full sm:w-[400px]" : "w-0 border-none overflow-hidden"
          )}
        >
          {showDetail && (
            <div className="flex-1 overflow-hidden flex flex-col">
               <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted">{selectedPlace ? "POI INTELLIGENCE" : "DAY CONTROL"}</span>
                  <button onClick={() => { setShowDetail(false); setSelectedPlace(null); }} className="text-muted hover:text-foreground transition-colors">
                     <X size={16} />
                  </button>
               </header>
               
               <div className="flex-1 overflow-y-auto">
                  {selectedPlace ? (
                    <div className="p-8 space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                       <header>
                          <div className="flex items-center gap-3 mb-4">
                             <span className="rounded-full bg-foreground px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-background">POINT OF INTEREST</span>
                             <span className="text-[10px] font-bold text-muted uppercase">{selectedPlace.category}</span>
                          </div>
                          <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground leading-none">{selectedPlace.name}</h2>
                          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted leading-relaxed">{selectedPlace.location}</p>
                          <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-muted">
                            Source: {selectedPlace.source.provider}
                          </p>
                       </header>

                       <section>
                          <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Context</h3>
                          <p className="text-sm font-medium leading-relaxed text-muted-2 italic">&quot;{selectedPlace.whyRecommended || selectedPlace.description}&quot;</p>
                       </section>

                       <div className="space-y-3">
                          {selectedPlace.coordinates && (
                            <>
                              <Link href="/map" className="block w-full">
                                 <button className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-foreground text-[10px] font-black uppercase tracking-widest text-background shadow-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all">
                                    <MapPin size={14} /> View on Map
                                 </button>
                              </Link>
                              <button
                                onClick={() => window.open(buildPlaceMapsUrl(selectedPlace), "_blank")}
                                className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-background text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-all"
                              >
                                <Navigation size={14} /> Open Exact Location
                              </button>
                            </>
                          )}
                          {!selectedPlace.coordinates && (
                            <div className="rounded-lg border border-border bg-background px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted">
                              Map view unavailable because this place has no coordinates.
                            </div>
                          )}
                          {!selectedPlace.coordinates && (
                            <button 
                              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.name)}`, "_blank")}
                              className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-background text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-all"
                            >
                               <Navigation size={14} /> Search in Google Maps
                            </button>
                          )}
                        </div>
                    </div>
                  ) : selectedPointName ? (
                    <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <header>
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-muted">
                          Unlinked itinerary point
                        </span>
                        <h2 className="mt-4 text-2xl font-black uppercase tracking-tight text-foreground">{selectedPointName}</h2>
                      </header>
                      <p className="text-sm leading-relaxed text-muted-2">
                        This point is present in the AI-authored itinerary text, but it is not linked to a saved or provider-backed place record yet.
                      </p>
                      <div className="rounded-lg border border-border bg-background px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted">
                        Map view unavailable until a matching place is saved from Discover.
                      </div>
                    </div>
                  ) : (
                    activeDay && (
                      <DayEditor 
                         key={activeDay.id} 
                         day={activeDay} 
                         onSave={onSaveDay} 
                         busy={busyAction === "save"} 
                         editMode={editMode}
                         setEditMode={setEditMode}
                      />
                    )
                  )}
               </div>
            </div>
          )}
        </aside>
      </main>

      {status && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-background shadow-2xl"
        >
          {status}
        </motion.div>
      )}

      {pendingDeleteDayId && (
        <DeleteDayDialog
          busy={busyAction === "delete"}
          onCancel={() => setPendingDeleteDayId(null)}
          onConfirm={confirmDeleteDay}
        />
      )}

      {pendingClear && (
        <ClearItineraryDialog
          onCancel={() => setPendingClear(false)}
          onConfirm={async () => {
            setPendingClear(false);
            await clearItinerary();
            setDays([]);
            setActiveDayId("");
            setShowDetail(false);
          }}
        />
      )}

      {showShuffleDialog && (
        <ManualShuffleDialog
          days={days}
          activeDayId={activeDay?.id || ""}
          onCancel={() => setShowShuffleDialog(false)}
          onConfirm={(candidateId) => {
            setShowShuffleDialog(false);
            handleExecuteShuffle(candidateId);
          }}
        />
      )}

      {generating && <AIBuildModal />}
    </div>
  );
}

function AIBuildModal() {
  const steps = [
    { id: 1, text: "Checking saved places", icon: Bookmark },
    { id: 2, text: "Balancing travel time", icon: Train },
    { id: 3, text: "Reviewing weather telemetry", icon: CloudSun },
    { id: 4, text: "Optimizing daily flow", icon: Sparkles },
    { id: 5, text: "Finalizing itinerary", icon: CheckCircle2 }
  ];
  
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(s => (s < steps.length - 1 ? s + 1 : s));
    }, 2500);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 backdrop-blur-md transition-all duration-500 animate-in fade-in">
       <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-foreground/10 bg-background p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center space-y-8">

          <div className="relative mx-auto size-24">
             <div className="absolute inset-0 rounded-full border-4 border-white/5" />
             <motion.div 
                className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
             />
             <div className="absolute inset-0 grid place-items-center text-emerald-500">
                <AnimatePresence mode="wait">
                  <motion.div
                     key={currentStep}
                     initial={{ scale: 0.5, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 1.5, opacity: 0 }}
                  >
                     {(() => {
                       const Icon = steps[currentStep].icon;
                       return <Icon size={32} strokeWidth={1.5} />;
                     })()}
                  </motion.div>
                </AnimatePresence>
             </div>
          </div>

          <div className="space-y-2">
             <h3 className="text-lg font-black uppercase tracking-widest text-foreground">Tactical Architect</h3>
             <div className="h-4">
                <AnimatePresence mode="wait">
                  <motion.p 
                     key={currentStep}
                     initial={{ y: 10, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     exit={{ y: -10, opacity: 0 }}
                     className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400"
                  >
                     {steps[currentStep].text}
                  </motion.p>
                </AnimatePresence>
             </div>
          </div>

          <div className="flex justify-center gap-1.5">
             {steps.map((_, i) => (
               <div 
                  key={i} 
                  className={cn(
                    "h-1 w-8 rounded-full transition-all duration-500",
                    i <= currentStep ? "bg-emerald-500" : "bg-white/10"
                  )} 
               />
             ))}
          </div>

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 animate-pulse">Neural engine engaged</p>
       </div>
    </div>
  );
}

function ManualShuffleDialog({ days, activeDayId, onCancel, onConfirm }: { 
  days: ItineraryDay[], 
  activeDayId: string, 
  onCancel: () => void, 
  onConfirm: (id: string) => void 
}) {
  const currentDay = days.find(d => d.id === activeDayId);
  
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl space-y-6">
        <div>
           <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Day Optimizer</h2>
           <p className="mt-1 text-[10px] font-bold text-muted uppercase tracking-tight">Swap contents of <span className="text-foreground font-black">{currentDay?.theme}</span> with another day.</p>
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-2 no-scrollbar">
           {days.filter(d => d.id !== activeDayId).map((day, idx) => (
             <button 
               key={day.id}
               onClick={() => onConfirm(day.id)}
               className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:border-foreground hover:bg-surface transition-all group text-left"
             >
                <div className="min-w-0 flex-1">
                   <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-1">Day 0{idx + 1} / {day.date}</p>
                   <p className="text-xs font-black uppercase tracking-tight text-foreground truncate">{day.theme}</p>
                </div>
                <RefreshCw size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-all" />
             </button>
           ))}
        </div>

        <button 
          onClick={onCancel}
          className="w-full h-10 rounded-lg border border-border bg-surface text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-all"
        >
           Cancel
        </button>
      </div>
    </div>
  );
}

function buildPlaceMapsUrl(place: PlaceRecommendation) {
  if (place.coordinates) {
    const query = `${place.coordinates.lat},${place.coordinates.lng}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
}

function buildPlaceDirectionsUrl(place: PlaceRecommendation) {
  if (place.coordinates) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${place.coordinates.lat},${place.coordinates.lng}`)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
}

type ScheduledPlace = {
  id: string;
  title: string;
  linkedPlace?: PlaceRecommendation;
};

function getScheduledPlaces(
  day: ItineraryDay | undefined,
  placesById: Map<string, PlaceRecommendation>,
  placesByNormalizedName: Map<string, PlaceRecommendation>,
) {
  const empty = { morning: [] as ScheduledPlace[], afternoon: [] as ScheduledPlace[], evening: [] as ScheduledPlace[] };
  if (!day?.places?.length) return empty;

  return day.places.reduce((accumulator, point, index) => {
    const slot =
      point.timeOfDay === "morning" || point.timeOfDay === "afternoon" || point.timeOfDay === "evening"
        ? point.timeOfDay
        : index === 0
          ? "morning"
          : index === 1
            ? "afternoon"
            : "evening";
    const linkedPlace =
      point.place ??
      (point.placeRecommendationId ? placesById.get(point.placeRecommendationId) : undefined) ??
      placesByNormalizedName.get(normalizeName(point.title));

    accumulator[slot].push({
      id: point.id,
      title: point.title,
      linkedPlace,
    });
    return accumulator;
  }, empty);
}

function PlanNode({
  label,
  content,
  places,
  onSelectPlace,
  setDays,
}: {
  icon: LucideIcon;
  label: string;
  content: string;
  places: ScheduledPlace[];
  onSelectPlace: (name: string) => void;
  setDays: React.Dispatch<React.SetStateAction<ItineraryDay[]>>;
}) {
  const router = useRouter();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Delete this point?")) return;
    
    // Optimistic Update
    setDays((current) => current.map(day => ({
      ...day,
      items: day.items?.filter(item => item.id !== id)
    })));

    const res = await deleteItineraryItem(id);
    if (res.ok) {
      router.refresh();
    } else {
      // router.refresh will eventually revert if the server is source of truth, 
      // but manually refreshing here or having a more robust rollback would be better.
      router.refresh(); 
    }
  };

  const handleStartEdit = (id: string, title: string) => {
    setEditingItemId(id);
    setEditTitle(title);
  };

  const handleSaveEdit = async () => {
    if (!editingItemId) return;

    const oldTitle = editTitle;
    const itemId = editingItemId;

    // Optimistic Update
    setDays((current) => current.map(day => ({
      ...day,
      items: day.items?.map(item => item.id === itemId ? { ...item, title: oldTitle } : item)
    })));

    setEditingItemId(null);
    const res = await updateItineraryItem(itemId, oldTitle);
    if (res.ok) {
      router.refresh();
    } else {
      router.refresh();
    }
  };

  return (
    <div className="relative pl-24 sm:pl-32 before:absolute before:left-[11px] before:top-8 before:h-full before:w-px before:bg-border last:before:hidden">
       <span className="absolute left-0 top-1.5 text-[11px] font-black font-mono text-muted tracking-widest leading-none">{markerFromLabel(label)}</span>
       <div className="absolute left-[12px] top-1.5 size-2 rounded-full bg-foreground ring-4 ring-background z-10" />
       <div className="space-y-4 sm:space-y-6">
          <div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{label}</p>
             <p className="mt-4 text-xl sm:text-2xl font-bold leading-relaxed text-foreground tracking-tight max-w-[50ch]">
                {content || "No activity scheduled for this window."}
             </p>
          </div>

          {places.length > 0 && (
             <div className="flex flex-wrap gap-2">
                {places.map(({ id, title, linkedPlace }) => (
                  <div key={id} className="group relative">
                    {editingItemId === id ? (
                      <div className="flex items-center gap-2 rounded-xl border border-black bg-surface p-2 shadow-lg animate-in zoom-in-95 duration-200">
                        <input 
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="bg-transparent text-[11px] font-black uppercase tracking-tight outline-none w-32"
                          onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                        />
                        <button onClick={handleSaveEdit} className="text-emerald-600 hover:text-emerald-700 transition-colors"><Save size={12} /></button>
                        <button onClick={() => setEditingItemId(null)} className="text-muted hover:text-foreground transition-colors"><X size={12} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onSelectPlace(title)}
                          className="group/item flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left transition-all duration-300 hover:border-foreground hover:shadow-lg hover:-translate-y-0.5 active:scale-95 shadow-sm"
                        >
                          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-background border border-border group-hover/item:bg-foreground group-hover/item:text-background transition-colors">
                             <MapPin size={14} />
                          </div>
                          <div className="min-w-0">
                            <span className="block truncate text-[11px] font-black uppercase tracking-tight text-foreground">{linkedPlace?.name ?? title}</span>
                            <span className="mt-0.5 block truncate text-[8px] font-black uppercase tracking-widest text-muted group-hover/item:text-muted-foreground transition-colors">
                              {linkedPlace?.coordinates ? "Provider mapped" : "AI text only"}
                            </span>
                          </div>
                        </button>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                           <button onClick={() => handleStartEdit(id, title)} className="p-1 text-muted hover:text-foreground transition-colors" title="Edit point"><Pencil size={10} /></button>
                           <button onClick={() => handleDeleteItem(id)} className="p-1 text-muted hover:text-rose-600 transition-colors" title="Remove point"><Trash2 size={10} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
             </div>
          )}
       </div>
    </div>
  );
}

function markerFromLabel(label: string) {
  if (label === "MORNING") return "08:00";
  if (label === "AFTERNOON") return "13:00";
  if (label === "EVENING") return "19:00";
  return "--:--";
}

function DayEditor({ day, onSave, busy, editMode, setEditMode }: { day: ItineraryDay, onSave: (updated: ItineraryDay) => Promise<void>, busy: boolean, editMode: boolean, setEditMode: (v: boolean) => void }) {
  const [draft, setDraft] = useState(day);
  const [adjustmentBusy, setAdjustmentBusy] = useState("");
  const [adjustmentStatus, setAdjustmentStatus] = useState("");
  const [adjustmentError, setAdjustmentError] = useState("");
  const [suggestion, setSuggestion] = useState<ItineraryDay | null>(null);

  async function requestAdjustment(label: string, instruction: string) {
    setAdjustmentBusy(label);
    setAdjustmentStatus(`Creating ${label.toLowerCase()} suggestion...`);
    setAdjustmentError("");
    setSuggestion(null);

    const response = await fetch("/api/ai/adjust-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, instruction }),
    });
    const result = await response.json();
    setAdjustmentBusy("");

    if (!response.ok || !result.ok || !result.data) {
      setAdjustmentStatus("");
      setAdjustmentError(result.raw ?? result.message ?? "Could not adjust this day.");
      return;
    }

    setSuggestion({ ...day, ...result.data, id: day.id, date: day.date });
    setAdjustmentStatus("Suggestion ready.");
  }

  async function applySuggestion() {
    if (!suggestion) return;
    await onSave(suggestion);
    setSuggestion(null);
    setAdjustmentStatus("Suggestion applied.");
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-6 bg-background">
          <div className="flex items-center justify-between mb-8">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted">{editMode ? "Editor Active" : "Operational Controls"}</span>
            {!editMode ? (
              <button onClick={() => setEditMode(true)} className="flex items-center gap-2 text-[9px] font-black uppercase text-muted hover:text-foreground transition-colors">
                <Edit3 size={12} /> Edit Plan
              </button>
            ) : (
              <button onClick={() => setEditMode(false)} className="flex items-center gap-2 text-[9px] font-black uppercase text-rose-600 hover:text-rose-700 transition-colors">
                <X size={12} /> Cancel
              </button>
            )}
          </div>
          
          <div className="space-y-6">
             <DetailSection icon={Utensils} title="Cuisine Context" content={day.restaurantIdeas} />
             <DetailSection icon={Train} title="Transit Intelligence" content={day.transportNotes} />
             <DetailSection icon={Sparkles} title="Hidden Objective" content={day.hiddenGem} />
             <DetailSection icon={ShieldCheck} title="Backup Plan" content={day.backupOption} />
          </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-10 border-t border-border mt-4">
          {editMode ? (
            <div className="space-y-8">
              <EditField label="Morning Plan">
                  <Textarea value={draft.morningPlan} onChange={(e) => setDraft({ ...draft, morningPlan: e.target.value })} className="min-h-[80px] bg-surface text-xs" />
              </EditField>
              <EditField label="Afternoon Plan">
                  <Textarea value={draft.afternoonPlan} onChange={(e) => setDraft({ ...draft, afternoonPlan: e.target.value })} className="min-h-[80px] bg-surface text-xs" />
              </EditField>
              <EditField label="Evening Plan">
                  <Textarea value={draft.eveningPlan} onChange={(e) => setDraft({ ...draft, eveningPlan: e.target.value })} className="min-h-[80px] bg-surface text-xs" />
              </EditField>
            </div>
          ) : (
            <section className="space-y-4 pt-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">AI Day Tools</h3>
                <div className="grid grid-cols-2 gap-2">
                  <DayToolButton
                    label="Regenerate"
                    busy={adjustmentBusy === "Regenerate"}
                    icon={RefreshCw}
                    onClick={() => requestAdjustment("Regenerate", "Regenerate this day with the same destination, interests, and budget. Keep it practical.")}
                  />
                  <DayToolButton
                    label="More relaxed"
                    busy={adjustmentBusy === "More relaxed"}
                    onClick={() => requestAdjustment("More relaxed", "Make this day more relaxed with fewer moves and more breathing room.")}
                  />
                  <DayToolButton
                    label="Cheaper"
                    busy={adjustmentBusy === "Cheaper"}
                    onClick={() => requestAdjustment("Cheaper", "Make this day cheaper with more free activities and lower-cost food.")}
                  />
                  <DayToolButton
                    label="Rain plan"
                    busy={adjustmentBusy === "Rain plan"}
                    icon={CloudRain}
                    onClick={() => requestAdjustment("Rain plan", "Replace outdoor activities with indoor rainy-day alternatives.")}
                  />
                </div>
                {adjustmentStatus ? <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{adjustmentStatus}</p> : null}
                {adjustmentError ? <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600">{adjustmentError}</p> : null}
                {suggestion && (
                  <div className="space-y-3 rounded-xl border border-border bg-background p-4 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted">Suggested Change</p>
                    <p className="text-xs font-bold uppercase text-foreground">{suggestion.theme}</p>
                    <button
                      type="button"
                      onClick={applySuggestion}
                      disabled={busy}
                      className="flex h-9 w-full items-center justify-center rounded-md bg-foreground px-4 text-[9px] font-black uppercase tracking-widest text-background transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
                    >
                      Apply Suggestion
                    </button>
                  </div>
                )}
            </section>
          )}
      </div>

      {editMode && (
        <div className="p-6 border-t border-border bg-surface">
            <button 
              onClick={() => onSave(draft)}
              disabled={busy}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-foreground text-[10px] font-black uppercase tracking-[0.2em] text-background shadow-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Commit Changes
            </button>
        </div>
      )}
    </div>
  );
}

function EditField({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-3">
       <label className="text-[9px] font-black uppercase tracking-[0.1em] text-muted">{label}</label>
       {children}
    </div>
  );
}

function TimelineDay({ day, idx, active, onClick, onDelete, impact, weather }: { day: ItineraryDay, idx: number, active: boolean, onClick: () => void, onDelete: () => void, impact?: ItineraryWeatherImpact, weather?: WeatherSummary["daily"][number] }) {
  const riskColor = impact?.risk === "high" ? "bg-rose-500" : impact?.risk === "medium" ? "bg-amber-500" : "bg-emerald-500";
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer border-l-4 py-6 pl-6 transition-all",
        active ? "border-foreground bg-surface-2" : "border-transparent hover:bg-surface"
      )}
    >
      <div className="flex items-center justify-between pr-4">
        <div className="flex items-center gap-2">
           <div className={cn("size-2 rounded-full shadow-sm", riskColor)} title={`${impact?.risk || "low"} weather risk`} />
           <span className="text-[10px] font-black uppercase tracking-widest text-muted">
             DAY 0{idx + 1} <span className="mx-2 opacity-30">/</span> {formatShortDate(day.date)}
           </span>
        </div>
        <div className="flex items-center gap-3">
          {weather && <WeatherIcon code={weather.weatherCode} size={12} className="text-muted group-hover:text-foreground transition-colors" />}
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-rose-600"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      
      <h3 className={cn("mt-2 text-sm font-black uppercase tracking-tight truncate pr-6", active ? "text-foreground" : "text-muted-2")}>
        {day.theme}
      </h3>
    </div>
  );
}

function DetailSection({ icon: Icon, title, content }: { icon: LucideIcon, title: string, content?: string | string[] }) {
  if (!content || (Array.isArray(content) && content.length === 0)) return null;
  return (
    <section>
       <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3 flex items-center gap-2">
          <Icon size={10} /> {title}
       </h3>
       <p className="text-xs leading-relaxed text-muted-2 font-medium">
          {Array.isArray(content) ? content.join(", ") : content}
       </p>
    </section>
  );
}

function DayToolButton({
  label,
  busy,
  icon: Icon,
  onClick,
}: {
  label: string;
  busy: boolean;
  icon?: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-[9px] font-black uppercase tracking-widest text-muted transition-all hover:text-foreground disabled:opacity-50"
    >
      {busy ? <Loader2 size={12} className="animate-spin" /> : Icon ? <Icon size={12} /> : null}
      {label}
    </button>
  );
}

function ToolbarButton({ 
  children, 
  onClick, 
  disabled, 
  primary = false, 
  title, 
  className,
  type = "button"
}: { 
  children: React.ReactNode, 
  onClick?: MouseEventHandler<HTMLButtonElement>, 
  disabled?: boolean, 
  primary?: boolean, 
  title?: string, 
  className?: string,
  type?: "button" | "submit" | "reset"
}) {
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      title={title}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-md px-3 text-[9px] font-black uppercase tracking-wider transition-all",
        primary 
          ? "bg-foreground text-background hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-300 shadow-lg" 
          : "bg-surface-2 text-muted hover:bg-border disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

function ClearItineraryDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="clear-itinerary-title">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-md border border-rose-200 bg-rose-50 text-rose-600">
            <Trash2 size={16} />
          </div>
          <div className="min-w-0">
            <h2 id="clear-itinerary-title" className="text-sm font-bold text-foreground">
              Clear entire timeline?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-2">
              All days and scheduled activities will be permanently removed. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-border bg-background h-10 text-[10px] font-black uppercase tracking-widest text-muted transition-colors hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-rose-600 h-10 text-[10px] font-black uppercase tracking-widest text-background transition-colors hover:bg-rose-700"
          >
            Clear timeline
          </button>
        </div>
      </div>
    </div>
  );
}

function formatShortDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`).toLocaleDateString("en-US", { month: 'short', day: 'numeric' }).toUpperCase();
}

function DeleteDayDialog({
  busy,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="delete-day-title">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-md border border-rose-200 bg-rose-50 text-rose-600">
            <Trash2 size={16} />
          </div>
          <div className="min-w-0">
            <h2 id="delete-day-title" className="text-sm font-bold text-foreground">
              Delete day?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-2">
              This day and all its scheduled activities will be removed from your itinerary.
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-border bg-background h-10 text-[10px] font-black uppercase tracking-widest text-muted transition-colors hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-lg bg-rose-600 h-10 text-[10px] font-black uppercase tracking-widest text-background transition-colors hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 size={12} className="animate-spin" />}
            Delete day
          </button>
        </div>
      </div>
    </div>
  );
}
