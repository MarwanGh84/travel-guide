"use client";

import { cn, formatCurrency } from "@/lib/utils";
import { 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  AlertTriangle, 
  Loader2, 
  MapPin, 
  ChevronRight,
  Navigation,
} from "lucide-react";
import { WeatherIcon } from "../weather-icon";
import type { ItineraryDay, PlaceRecommendation } from "@/lib/types/travel";
import type { ItineraryWeatherImpact } from "@/lib/travel/weather-intelligence";
import { markerFromLabel } from "./itinerary-utils";

type DayDetailProps = {
  activeDay: ItineraryDay;
  activeWeather?: {
    label: string;
    maxC: number;
    minC: number;
    weatherCode: number;
  };
  activeWeatherImpact?: ItineraryWeatherImpact;
  shuffleOption?: {
    candidateDayId: string;
    candidateTheme: string;
  } | null;
  busyAction: string;
  tacticalPoints: Array<{
    id: string;
    title: string;
    placeRecommendationId?: string;
    place?: PlaceRecommendation;
  }>;
  scheduledPlaces: {
    morning: Array<{ id: string; title: string; linkedPlace?: PlaceRecommendation }>;
    afternoon: Array<{ id: string; title: string; linkedPlace?: PlaceRecommendation }>;
    evening: Array<{ id: string; title: string; linkedPlace?: PlaceRecommendation }>;
  };
  onOptimizeDay: () => void;
  onExecuteShuffle: (candidateId?: string) => void;
  onMitigate: () => void;
  onSelectPoint: (name: string) => void;
  onNavigateToPlace: (place: PlaceRecommendation) => void;
  setDays: React.Dispatch<React.SetStateAction<ItineraryDay[]>>;
};

export function ItineraryDayDetail({
  activeDay,
  activeWeather,
  activeWeatherImpact,
  shuffleOption,
  busyAction,
  tacticalPoints,
  scheduledPlaces,
  onOptimizeDay,
  onExecuteShuffle,
  onMitigate,
  onSelectPoint,
  onNavigateToPlace,
  setDays,
}: DayDetailProps) {
  return (
    <section className="flex-1 overflow-y-auto bg-background p-6 sm:p-12 lg:p-12 xl:p-16 border-r border-border scrollbar-hide">
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
              onClick={onOptimizeDay}
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
                      onClick={() => onExecuteShuffle()}
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
                  onClick={onMitigate}
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
                {tacticalPoints.map((point, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-2 rounded-xl border-2 border-border bg-background p-2 transition-all duration-300 hover:border-black hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectPoint(point.title)}
                      className="group/btn flex min-w-0 flex-1 items-center justify-between rounded-lg p-2 text-left"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-muted group-hover/btn:text-foreground transition-colors">
                          <MapPin size={18} />
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate text-[11px] font-black uppercase tracking-tight leading-none mb-1">{point.title}</span>
                          <span className="block truncate text-[8px] font-black uppercase tracking-widest text-muted group-hover/btn:text-muted-foreground transition-colors">
                            {point.place?.coordinates ? `${point.place.location || "Provider mapped"} · ${point.place.source.provider}` : point.place ? "Provider record" : "AI text only"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={12} className="shrink-0 text-muted transition-transform group-hover/btn:translate-x-1" />
                    </button>
                    {point.place?.coordinates && (
                      <button
                        type="button"
                        onClick={() => onNavigateToPlace(point.place!)}
                        className="grid size-10 shrink-0 place-items-center rounded-lg bg-foreground text-background shadow-lg transition-all active:scale-90 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                      >
                        <Navigation size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <PlanNode
            label="MORNING"
            content={activeDay.morningPlan}
            places={scheduledPlaces.morning}
            onSelectPlace={onSelectPoint}
            setDays={setDays}
          />
          <PlanNode
            label="AFTERNOON"
            content={activeDay.afternoonPlan}
            places={scheduledPlaces.afternoon}
            onSelectPlace={onSelectPoint}
            setDays={setDays}
          />
          <PlanNode
            label="EVENING"
            content={activeDay.eveningPlan}
            places={scheduledPlaces.evening}
            onSelectPlace={onSelectPoint}
            setDays={setDays}
          />
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Pencil, Trash2 } from "lucide-react";
import { deleteItineraryItem, updateItineraryItem } from "@/app/actions";

function PlanNode({
  label,
  content,
  places,
  onSelectPlace,
  setDays,
}: {
  label: string;
  content: string;
  places: Array<{ id: string; title: string; linkedPlace?: PlaceRecommendation }>;
  onSelectPlace: (name: string) => void;
  setDays: React.Dispatch<React.SetStateAction<ItineraryDay[]>>;
}) {
  const router = useRouter();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Delete this point?")) return;
    
    setDays((current) => current.map(day => ({
      ...day,
      places: day.places?.filter(item => item.id !== id)
    })));

    const res = await deleteItineraryItem(id);
    if (res.ok) router.refresh();
    else router.refresh();
  };

  const handleStartEdit = (id: string, title: string) => {
    setEditingItemId(id);
    setEditTitle(title);
  };

  const handleSaveEdit = async () => {
    if (!editingItemId) return;
    const oldTitle = editTitle;
    const itemId = editingItemId;

    setDays((current) => current.map(day => ({
      ...day,
      places: day.places?.map(item => item.id === itemId ? { ...item, title: oldTitle } : item)
    })));

    setEditingItemId(null);
    const res = await updateItineraryItem(itemId, oldTitle);
    if (res.ok) router.refresh();
    else router.refresh();
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
