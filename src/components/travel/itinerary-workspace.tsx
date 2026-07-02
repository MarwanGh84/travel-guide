"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { 
  CalendarDays,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn, normalizeName } from "@/lib/utils";
import type { ItineraryDay, PlaceRecommendation, TripDraft } from "@/lib/types/travel";
import type { WeatherSummary } from "@/lib/api/weatherService";
import type { ItineraryWeatherImpact } from "@/lib/travel/weather-intelligence";
import { 
  clearItinerary, 
  approveItinerary, 
  reopenItinerary, 
  shuffleItineraryDays,
} from "@/app/actions";
import { findShuffleCandidate } from "@/lib/travel/weather-intelligence";

// Modular Components
import { ItineraryTimeline } from "./itinerary/itinerary-timeline";
import { ItineraryDayDetail } from "./itinerary/itinerary-day-detail";
import { ItineraryEditor } from "./itinerary/itinerary-editor";
import { ItineraryPOIDetail } from "./itinerary/itinerary-poi-detail";
import { 
  AIBuildModal, 
  ManualShuffleDialog, 
  ClearItineraryDialog, 
  DeleteDayDialog 
} from "./itinerary/itinerary-modals";
import { buildPlaceDirectionsUrl } from "./itinerary/itinerary-utils";

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
    try {
      const selectedIds = selectedPlaces.map((p) => p.id);
      const response = await fetch("/api/ai/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ save: true, selectedPlaceIds: selectedIds }),
      });
      const result = await response.json();
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
    } catch {
      setStatus("Itinerary generation failed. Try again.");
      setTimeout(() => setStatus(""), 5000);
    } finally {
      setGenerating(false);
    }
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
    setDays((current) => current.map((d) => (d.id === updated.id ? updated : d)));
    
    const response = await fetch("/api/itinerary/day", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setBusyAction("");
    if (response.ok) {
      setEditMode(false);
      setStatus("Day updated.");
      setTimeout(() => setStatus(""), 2000);
      return;
    }
    setDays(initialDays);
    setStatus("Could not save this itinerary day.");
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

    setDays((current) => {
      const d1Idx = current.findIndex(d => d.id === activeDay.id);
      const d2Idx = current.findIndex(d => d.id === targetId);
      if (d1Idx === -1 || d2Idx === -1) return current;
      const next = [...current];
      const d1 = next[d1Idx];
      const d2 = next[d2Idx];
      const newTheme1 = d1.theme.replace(/Day \d+/gi, `Day ${d2Idx + 1}`);
      const newTheme2 = d2.theme.replace(/Day \d+/gi, `Day ${d1Idx + 1}`);
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
       setDays(initialDays);
       setStatus(result.message || "Shuffle failed");
       setTimeout(() => setStatus(""), 5000);
    }
  };

  const handleMitigate = async () => {
    if (!activeDay) return;
    setBusyAction("mitigate");
    setStatus("Deploying weather mitigation strategy...");
    const instruction = `URGENT: High weather risk detected for this day. Regenerate this day to be 100% INDOOR focused.`;
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
      <ItineraryTimeline
        trip={trip}
        days={days}
        activeDayId={activeDayId}
        generating={generating}
        busyAction={busyAction}
        weather={weather}
        weatherImpact={weatherImpact}
        onSelectDay={handleSelectDay}
        onDeleteDay={setPendingDeleteDayId}
        onGenerate={generate}
        onClear={() => setPendingClear(true)}
        onAddDay={addDay}
        onExport={exportJson}
        onReopen={async () => { await reopenItinerary(); router.refresh(); }}
        onApprove={async () => { await approveItinerary(); router.refresh(); }}
      />

      <main className="relative flex-1 bg-surface-2 overflow-hidden flex flex-col lg:flex-row">
        {activeDay ? (
          <ItineraryDayDetail
            activeDay={activeDay}
            activeWeather={activeWeather}
            activeWeatherImpact={activeWeatherImpact}
            shuffleOption={shuffleOption}
            busyAction={busyAction}
            tacticalPoints={tacticalPoints}
            scheduledPlaces={scheduledPlaces}
            onOptimizeDay={() => setShowShuffleDialog(true)}
            onExecuteShuffle={handleExecuteShuffle}
            onMitigate={handleMitigate}
            onSelectPoint={handleSelectPoint}
            onNavigateToPlace={(place) => window.open(buildPlaceDirectionsUrl(place), "_blank")}
            setDays={setDays}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-12 text-center">
            <div className="space-y-4">
              <CalendarDays size={64} className="mx-auto text-muted" strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Generate or add a day to begin</p>
            </div>
          </div>
        )}

        <aside className={cn(
          "fixed inset-y-0 right-0 z-40 border-l border-border bg-surface transition-all duration-300 shadow-2xl flex flex-col lg:relative lg:inset-auto lg:shrink-0 lg:z-20",
          showDetail ? "w-full sm:w-[400px]" : "w-0 border-none overflow-hidden"
        )}>
          {showDetail && (
            <>
              {selectedPlace || selectedPointName ? (
                <ItineraryPOIDetail
                  selectedPlace={selectedPlace}
                  selectedPointName={selectedPointName}
                  onClose={() => { setShowDetail(false); setSelectedPlace(null); }}
                />
              ) : (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted">DAY CONTROL</span>
                    <button onClick={() => setShowDetail(false)} className="text-muted hover:text-foreground transition-colors">
                      <X size={16} />
                    </button>
                  </header>
                  <div className="flex-1 overflow-y-auto">
                    {activeDay && (
                      <ItineraryEditor 
                        key={activeDay.id} 
                        day={activeDay} 
                        onSave={onSaveDay} 
                        busy={busyAction === "save"} 
                        editMode={editMode}
                        setEditMode={setEditMode}
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </aside>
      </main>

      {status && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-background shadow-2xl">
          {status}
        </motion.div>
      )}

      {pendingDeleteDayId && (
        <DeleteDayDialog busy={busyAction === "delete"} onCancel={() => setPendingDeleteDayId(null)} onConfirm={confirmDeleteDay} />
      )}

      {pendingClear && (
        <ClearItineraryDialog onCancel={() => setPendingClear(false)} onConfirm={async () => { setPendingClear(false); await clearItinerary(); setDays([]); setActiveDayId(""); setShowDetail(false); }} />
      )}

      {showShuffleDialog && (
        <ManualShuffleDialog days={days} activeDayId={activeDay?.id || ""} onCancel={() => setShowShuffleDialog(false)} onConfirm={(candidateId) => { setShowShuffleDialog(false); handleExecuteShuffle(candidateId); }} />
      )}

      {generating && <AIBuildModal />}
    </div>
  );
}

function getScheduledPlaces(
  day: ItineraryDay | undefined,
  placesById: Map<string, PlaceRecommendation>,
  placesByNormalizedName: Map<string, PlaceRecommendation>,
) {
  type ScheduledPoint = { id: string; title: string; linkedPlace: PlaceRecommendation | undefined };
  const empty: { morning: ScheduledPoint[]; afternoon: ScheduledPoint[]; evening: ScheduledPoint[] } = { morning: [], afternoon: [], evening: [] };
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
