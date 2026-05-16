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
  ExternalLink,
  CalendarDays,
  LucideIcon,
  ChevronRight,
  ChevronLeft,
  CloudRain,
  Edit3,
  RefreshCw,
  Save,
  X,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatCurrency, normalizeName } from "@/lib/utils";
import type { ItineraryDay, PlaceRecommendation, TripDraft } from "@/lib/types/travel";
import { InteractiveMap } from "@/components/travel/interactive-map";
import { Input, Textarea } from "@/components/ui/input";
import { clearItinerary } from "@/app/actions";

type ItineraryWorkspaceProps = {
  trip: TripDraft | null;
  initialDays: ItineraryDay[];
  selectedPlaces: PlaceRecommendation[];
  shouldAutoGenerate: boolean;
};

export function ItineraryWorkspace({ initialDays, selectedPlaces, shouldAutoGenerate, trip }: ItineraryWorkspaceProps) {
  const [days, setDays] = useState<ItineraryDay[]>(initialDays);
  const [activeDayId, setActiveDayId] = useState(initialDays[0]?.id ?? "");
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const [showDetail, setShowDetail] = useState(Boolean(initialDays[0]));
  const [editMode, setEditMode] = useState(false);
  const [busyAction, setBusyAction] = useState("");
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
    if (response.ok) {
      const result = await response.json();
      setDays((current) => current.map((d) => (d.id === result.data.id ? result.data : d)));
      setEditMode(false);
      setStatus("Day updated.");
      setTimeout(() => setStatus(""), 2000);
    }
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
  };

  return (
    <div className="flex h-full w-full overflow-hidden flex-col lg:flex-row">
      {/* 1. Timeline Pane */}
      <aside className={cn(
        "flex w-full shrink-0 flex-col border-r border-border bg-surface transition-all duration-300 lg:w-[350px]",
        activeDayId && "h-[200px] lg:h-full"
      )}>
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">TIMELINE</span>
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-muted">
              {days.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ToolbarButton onClick={generate} disabled={generating} primary title="Generate with AI">
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
            <div className="p-12 text-center opacity-40">
               <CalendarDays size={32} className="mx-auto mb-4" strokeWidth={1} />
               <p className="text-[10px] font-bold uppercase tracking-widest">No timeline segments</p>
            </div>
          )}
        </div>
      </aside>

      {/* 2. Main Map Stage */}
      <main className="relative flex-1 bg-surface-2 overflow-hidden flex flex-col lg:flex-row">
        <div className="flex-1 relative overflow-hidden min-h-[300px]">
           <InteractiveMap 
             route={{
               provider: "google-maps",
               center: { lat: 0, lng: 0 },
               zoom: 12,
               pins: activeDay?.placesIncluded.map((p, i) => {
                 const matched = selectedPlaces.find(sp => normalizeName(sp.name) === normalizeName(p));
                 return {
                   id: matched?.id ?? `${activeDay.id}-p-${i}`,
                   lat: matched?.coordinates?.lat ?? 0,
                   lng: matched?.coordinates?.lng ?? 0,
                   label: matched?.name ?? p,
                   category: matched?.category ?? "Activity",
                   isHiddenGem: matched?.hiddenGemScore ? matched.hiddenGemScore >= 50 : false,
                   location: matched?.location ?? "Local area"
                 };
               }) ?? [],
               routePins: [],
               distanceMeters: 0,
               duration: "0m",
               routeNote: "Active Day Map",
               isMock: false
             }} 
             mapImageBaseUrl="/api/maps/static?width=1200&height=800&markers=true" 
           />
        </div>

        {/* Retractable Detail & Edit Pane */}
        <div
          className={cn(
            "fixed inset-y-0 right-0 z-40 border-l border-border bg-background transition-all duration-300 shadow-2xl flex flex-col lg:relative lg:inset-auto lg:shrink-0 lg:z-20",
            showDetail && activeDay ? "w-full sm:w-[400px]" : "w-0 border-none"
          )}
        >
          {activeDay && (
          <div className={cn("absolute -left-8 top-1/2 -translate-y-1/2 z-30", !showDetail && "left-0")}>
            <button 
              onClick={() => setShowDetail(!showDetail)}
              className="grid size-8 place-items-center rounded-l-md border border-r-0 border-border bg-background text-muted hover:text-black shadow-sm"
            >
               {showDetail ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
          )}

          <div className="flex-1 overflow-hidden w-full sm:w-[400px] flex flex-col">
            <AnimatePresence mode="wait">
               {showDetail && activeDay && (
                 <DayEditor 
                    key={activeDay.id} 
                    day={activeDay} 
                    onSave={onSaveDay} 
                    busy={busyAction === "save"} 
                    onClose={() => setShowDetail(false)}
                    editMode={editMode}
                    setEditMode={setEditMode}
                 />
               )}
            </AnimatePresence>
          </div>
        </div>
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

function DayEditor({ day, onSave, busy, onClose, editMode, setEditMode }: { day: ItineraryDay, onSave: (updated: ItineraryDay) => Promise<void>, busy: boolean, onClose: () => void, editMode: boolean, setEditMode: (v: boolean) => void }) {
  const [draft, setDraft] = useState(day);
  const [suggestion, setSuggestion] = useState<ItineraryDay | null>(null);
  const [adjustmentBusy, setAdjustmentBusy] = useState("");
  const [adjustmentStatus, setAdjustmentStatus] = useState("");
  const [adjustmentError, setAdjustmentError] = useState("");

  // We use key prop on the component to avoid needing an effect to reset draft when day changes.
  // This satisfies the React linter by avoiding setState in effect.

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

    if (!response.ok || !result.data) {
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex-1 flex flex-col overflow-hidden"
    >
      <div className="p-6 border-b border-border bg-surface">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted">{editMode ? "Editor Active" : "Intensive Detail"}</span>
            <div className="flex items-center gap-4">
                {!editMode ? (
                  <button onClick={() => setEditMode(true)} className="flex items-center gap-2 text-[9px] font-black uppercase text-muted hover:text-black transition-colors">
                    <Edit3 size={12} /> Edit
                  </button>
                ) : (
                  <button onClick={() => setEditMode(false)} className="flex items-center gap-2 text-[9px] font-black uppercase text-rose-600 hover:text-rose-700 transition-colors">
                    <X size={12} /> Cancel
                  </button>
                )}
                <button onClick={onClose} className="lg:hidden">
                   <X size={16} className="text-muted" />
                </button>
            </div>
          </div>
          
          {editMode ? (
            <Input 
              value={draft.theme} 
              onChange={(e) => setDraft({ ...draft, theme: e.target.value })}
              className="mt-4 h-10 border-none bg-background p-0 text-2xl font-black uppercase tracking-tighter focus:ring-0" 
            />
          ) : (
            <h2 className="mt-4 text-2xl font-black uppercase tracking-tighter leading-tight">{day.theme}</h2>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-muted">
            <span className="flex items-center gap-1.5"><Clock size={12} /> {formatShortDate(day.date)}</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={12} /> {formatCurrency(day.estimatedCost)}</span>
          </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-10">
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
              <EditField label="Cost Estimate">
                  <Input type="number" value={draft.estimatedCost} onChange={(e) => setDraft({ ...draft, estimatedCost: Number(e.target.value) })} className="bg-surface text-xs" />
              </EditField>
            </div>
          ) : (
            <>
              <DetailSection icon={Utensils} title="Cuisine Context" content={day.restaurantIdeas} />
              <DetailSection icon={Train} title="Transit Intelligence" content={day.transportNotes} />
              <DetailSection icon={Sparkles} title="Hidden Objective" content={day.hiddenGem} />
              <DetailSection icon={ShieldCheck} title="Backup Plan" content={day.backupOption} />
              <DetailSection icon={CalendarDays} title="Notes" content={day.notes} />
              
              <section>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 flex items-center gap-2">
                    <MapPin size={10} /> Active Points
                  </h3>
                  <div className="space-y-1">
                    {day.placesIncluded.map((p, i) => (
                      <div key={`${day.id}-p-${i}`} className="flex items-center justify-between rounded-md border border-border/60 p-3 hover:bg-surface-2 transition-colors cursor-default group">
                          <span className="text-xs font-bold truncate pr-4 uppercase tracking-tight">{p}</span>
                          <ExternalLink size={12} className="text-border group-hover:text-muted shrink-0 transition-colors" />
                      </div>
                    ))}
                  </div>
              </section>

              <section className="space-y-4 border-t border-border pt-6">
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
                {suggestion ? (
                  <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted">Suggested Change</p>
                    <p className="text-sm font-bold uppercase tracking-tight text-foreground">{suggestion.theme}</p>
                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-2">{suggestion.morningPlan}</p>
                    <button
                      type="button"
                      onClick={applySuggestion}
                      disabled={busy}
                      className="flex h-9 items-center justify-center rounded-md bg-black px-4 text-[9px] font-black uppercase tracking-widest text-white transition-all hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Apply Suggestion
                    </button>
                  </div>
                ) : null}
              </section>
            </>
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
    </motion.div>
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
      
      <div className="mt-4 space-y-3 lg:block hidden">
         <TimelineEvent marker="AM" content={day.morningPlan} active={active} />
         <TimelineEvent marker="PM" content={day.afternoonPlan} active={active} />
         <TimelineEvent marker="EV" content={day.eveningPlan} active={active} />
      </div>
    </div>
  );
}

function TimelineEvent({ marker, content, active }: { marker: string, content: string, active: boolean }) {
  return (
    <div className="flex items-start gap-4">
       <span className={cn(
         "mt-0.5 grid h-4 w-7 shrink-0 place-items-center rounded-[2px] text-[8px] font-black",
         active ? "bg-black text-white" : "bg-border text-muted"
       )}>
         {marker}
       </span>
       <p className={cn(
         "text-xs leading-relaxed line-clamp-1 font-medium",
         active ? "text-foreground" : "text-muted"
       )}>
         {content || "No activity scheduled"}
       </p>
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
