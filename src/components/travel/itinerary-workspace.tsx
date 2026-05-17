"use client";

import { useCallback, useEffect, useRef, useState, type MouseEventHandler } from "react";
import {
  Sparkles,
  Plus,
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
  Edit3,
  RefreshCw,
  Save,
  X,
  Download,
  Navigation,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatCurrency, normalizeName } from "@/lib/utils";
import type { ItineraryDay, PlaceRecommendation, TripDraft } from "@/lib/types/travel";
import { Textarea } from "@/components/ui/input";
import { clearItinerary, approveItinerary, reopenItinerary } from "@/app/actions";
import Link from "next/link";

type ItineraryWorkspaceProps = {
  trip: TripDraft | null;
  initialDays: ItineraryDay[];
  selectedPlaces: PlaceRecommendation[];
  allPlaces: PlaceRecommendation[];
  shouldAutoGenerate: boolean;
};

export function ItineraryWorkspace({ initialDays, selectedPlaces, allPlaces, shouldAutoGenerate, trip }: ItineraryWorkspaceProps) {
  const [days, setDays] = useState<ItineraryDay[]>(initialDays);
  const [activeDayId, setActiveDayId] = useState(initialDays[0]?.id ?? "");
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const [showDetail, setShowDetail] = useState(Boolean(initialDays[0]));
  const [editMode, setEditMode] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceRecommendation | null>(null);
  const [selectedPointName, setSelectedPointName] = useState("");
  const autoGenerateStarted = useRef(false);

  const activeIndex = Math.max(0, days.findIndex((day) => day.id === activeDayId));
  const activeDay = days[activeIndex] ?? days[0];

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

  if (!trip) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-8 text-center">
        <div className="max-w-sm space-y-4">
          <CalendarDays size={40} className="mx-auto text-muted" strokeWidth={1.5} />
          <h1 className="text-lg font-black uppercase tracking-tight text-foreground">No active trip</h1>
          <p className="text-sm leading-relaxed text-muted-2">
            Create or select a trip before building an itinerary.
          </p>
          <Link href="/trips" className="inline-flex h-10 items-center justify-center rounded-lg bg-black px-4 text-[10px] font-black uppercase tracking-widest text-white">
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

  async function deleteDay(id: string) {
    if (!confirm("Are you sure you want to delete this day?")) return;
    const response = await fetch(`/api/itinerary/day?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) {
      setDays((current) => {
        const next = current.filter((d) => d.id !== id);
        setActiveDayId(next[0]?.id ?? "");
        return next;
      });
    }
  }

  async function onSaveDay(updated: ItineraryDay) {
    setBusyAction("save");
    const response = await fetch("/api/itinerary/day", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setBusyAction("");
    const result = await response.json();
    if (response.ok) {
      setDays((current) => current.map((d) => (d.id === result.data.id ? result.data : d)));
      setEditMode(false);
      setStatus("Day updated.");
      setTimeout(() => setStatus(""), 2000);
      return;
    }
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
    const matched = [...selectedPlaces, ...allPlaces].find(p => normalizeName(p.name) === normalizeName(name));
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

  return (
    <div className="flex h-full w-full overflow-hidden flex-col lg:flex-row">
      {/* 1. Timeline Pane */}
      <aside className={cn(
        "flex w-full shrink-0 flex-col border-r border-border bg-surface transition-all duration-300 lg:w-[400px]",
        activeDayId && "h-[250px] lg:h-full"
      )}>
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">TIMELINE</span>
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-muted">
              {days.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {trip?.status === "itinerary_approved" ? (
               <div className="flex items-center gap-1">
                  <div className="flex h-7 items-center gap-1.5 rounded-md bg-emerald-50 px-3 text-[9px] font-black uppercase tracking-wider text-emerald-600 ring-1 ring-emerald-200">
                    <ShieldCheck size={12} />
                    Committed
                  </div>
                  <form action={reopenItinerary}>
                     <ToolbarButton type="submit" title="Unlock for editing">Reopen</ToolbarButton>
                  </form>
               </div>
            ) : (
               <form action={approveItinerary}>
                 <ToolbarButton 
                    type="submit" 
                    primary 
                    disabled={days.length === 0 || generating} 
                    title="Commit itinerary and find stays"
                 >
                    <CheckCircle2 size={12} />
                    Approve
                 </ToolbarButton>
               </form>
            )}

            <div className="h-4 w-px bg-border mx-1" />

            <ToolbarButton 
               onClick={generate} 
               disabled={generating || trip?.status === "itinerary_approved"} 
               primary={trip?.status !== "itinerary_approved" && days.length === 0} 
               title="Generate with AI"
            >
              {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              AI Build
            </ToolbarButton>
            <form action={clearItinerary}>
               <ToolbarButton
                 type="submit"
                 onClick={(event) => {
                   if (!confirm("Clear the entire timeline?")) event.preventDefault();
                 }}
                 disabled={days.length === 0}
                 title="Clear timeline"
               >
                  Clear
               </ToolbarButton>
            </form>
            <ToolbarButton onClick={addDay} disabled={Boolean(busyAction)} title="Add manual segment">
              {busyAction === "add" ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Day
            </ToolbarButton>
            <div className="hidden lg:block h-4 w-px bg-border mx-1" />
            <ToolbarButton className="hidden lg:flex" onClick={exportJson} title="Export as JSON"><Download size={12} /></ToolbarButton>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/50 bg-background">
          {days.map((day, idx) => (
            <TimelineDay 
              key={day.id} 
              day={day} 
              idx={idx} 
              active={activeDayId === day.id}
              onClick={() => handleSelectDay(day.id)}
              onDelete={() => deleteDay(day.id)}
            />
          ))}
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
        <section className="flex-1 overflow-y-auto bg-background p-8 lg:p-16 xl:p-24 border-r border-border">
           {activeDay ? (
             <div className="max-w-3xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Active Objective</span>
                   <h1 className="mt-4 text-4xl lg:text-6xl font-black tracking-tighter uppercase text-foreground leading-none">{activeDay.theme}</h1>
                   <div className="mt-8 flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-muted">
                      <span className="flex items-center gap-2"><Clock size={14} /> {activeDay.date}</span>
                      <div className="h-4 w-px bg-border" />
                      <span className="flex items-center gap-2"><ShieldCheck size={14} /> Estimated {formatCurrency(activeDay.estimatedCost)}</span>
                      <div className="h-4 w-px bg-border" />
                      <span className="rounded-full border border-border bg-surface px-2 py-1 text-[9px]">AI-generated planning content</span>
                   </div>
                </header>

                <div className="space-y-12 pb-24">
                   <PlanNode icon={Clock} label="MORNING" content={activeDay.morningPlan} />
                   <PlanNode icon={Clock} label="AFTERNOON" content={activeDay.afternoonPlan} />
                   <PlanNode icon={Clock} label="EVENING" content={activeDay.eveningPlan} />

                   {activeDay.placesIncluded.length > 0 && (
                     <section>
                        <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Tactical Points</h3>
                        <div className="grid gap-2 sm:grid-cols-2">
                           {activeDay.placesIncluded.map((name, i) => (
                             <button 
                                key={i}
                                onClick={() => handleSelectPoint(name)}
                                className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 text-left hover:border-black transition-all group"
                             >
                                <div className="flex items-center gap-3">
                                   <div className="size-8 grid place-items-center rounded-lg bg-background border border-border text-muted group-hover:text-black">
                                      <MapPin size={14} />
                                   </div>
                                   <span className="text-xs font-bold uppercase tracking-tight">{name}</span>
                                </div>
                                <ChevronRight size={12} className="text-muted group-hover:translate-x-1 transition-transform" />
                             </button>
                           ))}
                        </div>
                     </section>
                   )}
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
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted">{selectedPlace ? "POI INTELLIGENCE" : "SEGMENT CONTROL"}</span>
                  <button onClick={() => { setShowDetail(false); setSelectedPlace(null); }} className="text-muted hover:text-black transition-colors">
                     <X size={16} />
                  </button>
               </header>
               
               <div className="flex-1 overflow-y-auto">
                  {selectedPlace ? (
                    <div className="p-8 space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                       <header>
                          <div className="flex items-center gap-3 mb-4">
                             <span className="rounded-full bg-black px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white">POINT OF INTEREST</span>
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
                            <Link href="/map" className="block w-full">
                               <button className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-black text-[10px] font-black uppercase tracking-widest text-white shadow-xl hover:bg-zinc-800 transition-all">
                                  <MapPin size={14} /> View on Map
                               </button>
                            </Link>
                          )}
                          {!selectedPlace.coordinates && (
                            <div className="rounded-lg border border-border bg-background px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted">
                              Map view unavailable because this place has no coordinates.
                            </div>
                          )}
                          <button 
                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.name)}`, "_blank")}
                            className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-background text-[10px] font-black uppercase tracking-widest text-muted hover:text-black transition-all"
                          >
                             <Navigation size={14} /> Open Navigation
                          </button>
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
           className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl"
        >
          {status}
        </motion.div>
      )}
    </div>
  );
}

function PlanNode({ icon: Icon, label, content }: { icon: LucideIcon, label: string, content: string }) {
  return (
    <div className="space-y-4">
       <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted">
          <Icon size={14} className="text-black" /> {label}
       </div>
       <p className="text-xl font-medium leading-relaxed text-muted-2 tracking-tight">{content || "No activity scheduled for this window."}</p>
    </div>
  );
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
              <button onClick={() => setEditMode(true)} className="flex items-center gap-2 text-[9px] font-black uppercase text-muted hover:text-black transition-colors">
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
                      className="flex h-9 w-full items-center justify-center rounded-md bg-black px-4 text-[9px] font-black uppercase tracking-widest text-white transition-all hover:bg-zinc-800 disabled:opacity-50"
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
              className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-black text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl hover:bg-zinc-800 transition-all disabled:opacity-50"
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

function TimelineDay({ day, idx, active, onClick, onDelete }: { day: ItineraryDay, idx: number, active: boolean, onClick: () => void, onDelete: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer border-l-4 py-6 pl-6 transition-all",
        active ? "border-black bg-surface-2" : "border-transparent hover:bg-surface"
      )}
    >
      <div className="flex items-center justify-between pr-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted">
          SEQUENCE 0{idx + 1} <span className="mx-2 opacity-30">/</span> {formatShortDate(day.date)}
        </span>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-rose-600"
        >
          <Trash2 size={12} />
        </button>
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
          ? "bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-300 shadow-lg" 
          : "bg-surface-2 text-muted hover:bg-border disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

function formatShortDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`).toLocaleDateString("en-US", { month: 'short', day: 'numeric' }).toUpperCase();
}
