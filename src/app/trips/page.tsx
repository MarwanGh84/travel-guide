"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  WandSparkles, 
  ShieldCheck,
  Trash2,
  MapPin,
  Calendar,
  Wallet,
  Activity,
  LucideIcon,
  Archive,
  ChevronRight,
  Sparkles,
  Plus,
  Loader2
} from "lucide-react";
import { createTrip, deleteTrip, deleteTripById, selectTrip } from "@/app/actions";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";

const interestsList = ["food", "beaches", "nature", "museums", "shopping", "nightlife", "history", "photography", "hidden gems"];
const steps = ["Identity", "Timing", "Style", "Interests", "Review"];

type Brief = {
  id: string;
  name: string;
  destination: string | null;
  country: string | null;
  startDate: string;
  endDate: string;
  duration: number;
  budget: number;
  pace: string;
  travelStyle: string;
  interests: string[];
  notes: string | null;
  status: string;
};

type LibraryTrip = {
  id: string;
  name: string;
  destination: string | null;
  destinationCountry: string | null;
  startDate: string;
  endDate: string;
  status: string;
  _count: {
    savedPlaces: number;
    itineraryDays: number;
    bookings: number;
  };
};

type PendingDelete = {
  id: string;
  name: string;
  isActive: boolean;
} | null;

export default function TripsPage() {
  const [step, setStep] = useState(0);
  const [destinationMode, setDestinationMode] = useState<"known" | "recommend">("known");
  const [activeBrief, setActiveBrief] = useState<Brief | null>(null);
  const [library, setLibrary] = useState<LibraryTrip[]>([]);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [isPending, startTransition] = useTransition();

  const fetchState = useCallback(async () => {
    try {
      const [summaryRes, libraryRes] = await Promise.all([
        fetch("/api/ai/summary"),
        fetch("/api/trips/list")
      ]);
      
      const summary = await summaryRes.json();
      const libraryData = await libraryRes.json();
      
      if (summary.ok && summary.trip) {
        setActiveBrief({
          ...summary.trip,
          notes: summary.trip.notes || "",
          interests: summary.trip.interests ? summary.trip.interests.split(", ") : []
        });
      } else {
        setActiveBrief(null);
      }

      if (libraryData.ok) {
        setLibrary(libraryData.data);
      }
    } catch {
      console.error("Failed to fetch trips state");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchState();
  }, [fetchState]);

  const handleSelectTrip = (formData: FormData) => {
    startTransition(async () => {
      await selectTrip(formData);
      await fetchState();
      window.dispatchEvent(new Event("trip-status-refresh"));
      setStep(0);
    });
  };

  const confirmDeleteTrip = () => {
    if (!pendingDelete) return;
    startTransition(async () => {
      if (pendingDelete.isActive) {
        await deleteTrip();
      } else {
        const formData = new FormData();
        formData.set("tripId", pendingDelete.id);
        await deleteTripById(formData);
      }
      await fetchState();
      window.dispatchEvent(new Event("trip-status-refresh"));
      setStep(0);
      setPendingDelete(null);
    });
  };

  return (
    <div className="flex h-full w-full overflow-hidden flex-col lg:flex-row bg-background">
      {/* 1. Step Rail / Library */}
      <aside className="flex w-full shrink-0 flex-col border-b border-border bg-surface p-6 lg:w-[350px] lg:border-b-0 lg:border-r">
        <div className="flex flex-col h-full gap-8 overflow-y-auto pr-1 scrollbar-hide">
          <section>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Management</span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Journeys</h1>
          </section>

          {/* Active Brief Summary Panel */}
          {activeBrief ? (
            <section className="rounded-xl border border-border bg-background p-5 shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
               <header className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                     <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Active Hub</span>
                  </div>
                  <span className="text-[9px] font-bold text-muted uppercase">{activeBrief.status}</span>
               </header>
               
               <div className="space-y-4">
                  <BriefItem icon={MapPin} label="Route" value={`${activeBrief.destination || 'Global'}, ${activeBrief.country || 'Anywhere'}`} />
                  <BriefItem icon={Calendar} label="Window" value={`${activeBrief.startDate} — ${activeBrief.endDate}`} />
                  <BriefItem icon={Calendar} label="Duration" value={`${activeBrief.duration} days`} />
                  <BriefItem icon={Wallet} label="Capital" value={formatCurrency(activeBrief.budget)} />
                  <BriefItem icon={Activity} label="Pace" value={activeBrief.pace} />
               </div>

               {activeBrief.interests.length > 0 && (
                 <div className="mt-4 flex flex-wrap gap-2">
                   {activeBrief.interests.map((interest) => (
                     <span key={interest} className="rounded-full border border-border bg-surface px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-muted">
                       {interest}
                     </span>
                   ))}
                 </div>
               )}

               <div className="mt-6 pt-4 border-t border-border">
                  <button 
                    onClick={() => setPendingDelete({ id: activeBrief.id, name: activeBrief.name, isActive: true })}
                    disabled={isPending}
                    className="w-full h-10 rounded-md border border-border bg-surface text-[9px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                     {isPending ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />} Terminate Brief
                  </button>
               </div>
            </section>
          ) : (
            <section className="rounded-xl border border-dashed border-border p-8 text-center opacity-50">
               <Sparkles size={32} className="mx-auto mb-4 text-muted" strokeWidth={1} />
               <p className="text-[10px] font-bold uppercase tracking-widest">No Active Workspace</p>
               <p className="mt-2 text-[9px] uppercase font-medium">Initialize a brief to start planning.</p>
            </section>
          )}

          {/* Trip Library Section */}
          {library.length > 0 && (
            <section className="space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted">Library</span>
                  <Archive size={12} className="text-muted" />
               </div>
               <div className="space-y-2">
                  {library.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-stretch overflow-hidden rounded-lg border transition-all",
                        item.id === activeBrief?.id ? "border-black bg-background ring-1 ring-black/5" : "border-border/60 bg-background/50 hover:border-black",
                        isPending && "opacity-50 grayscale",
                      )}
                    >
                      <form action={handleSelectTrip} className="min-w-0 flex-1">
                        <input type="hidden" name="tripId" value={item.id} />
                        <button
                          type="submit"
                          disabled={isPending || item.id === activeBrief?.id}
                          className="group h-full w-full p-4 text-left"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className={cn("truncate text-xs font-bold uppercase tracking-tight", item.id === activeBrief?.id ? "text-foreground" : "text-muted-2")}>{item.name}</h4>
                            {item.id !== activeBrief?.id && (
                              isPending ? <Loader2 size={10} className="animate-spin" /> : <ChevronRight size={12} className="text-muted transition-transform group-hover:translate-x-1" />
                            )}
                          </div>
                          <p className="mt-1 truncate text-[9px] font-bold uppercase tracking-widest text-muted">
                            {item.destination || "Planning"} · {item._count.itineraryDays} Days
                          </p>
                        </button>
                      </form>

                      {item.id !== activeBrief?.id && (
                        <div className="flex border-l border-border/70">
                          <button
                            type="button"
                            disabled={isPending}
                            aria-label={`Delete ${item.name}`}
                            title={`Delete ${item.name}`}
                            onClick={() => setPendingDelete({ id: item.id, name: item.name, isActive: false })}
                            className="grid w-11 place-items-center text-muted transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
               </div>
            </section>
          )}

          <nav className="hidden lg:block space-y-1">
             <div className="flex items-center gap-2 mb-4">
                <Plus size={14} className="text-muted" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">Builder Steps</span>
             </div>
             {steps.map((s, i) => (
               <div 
                  key={s} 
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-bold transition-all",
                    i === step ? "bg-black text-white shadow-lg translate-x-2" : i < step ? "text-emerald-600" : "text-muted"
                  )}
               >
                  <span className="grid size-4 place-items-center rounded-full border border-current text-[8px]">
                     {i < step ? <CheckCircle2 size={10} /> : i + 1}
                  </span>
                  {s.toUpperCase()}
               </div>
             ))}
          </nav>
        </div>
      </aside>

      {/* 2. Main Builder Workspace */}
      <main className="flex-1 overflow-y-auto">
        <form 
          key={activeBrief?.id || "new-trip"}
          action={createTrip} 
          className="relative mx-auto flex min-h-full max-w-2xl flex-col p-8 lg:p-24"
        >
          <input type="hidden" name="destinationMode" value={destinationMode} />
          <TripPreparingOverlay />
          
          <div className="flex-1">
            <header className="mb-12">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">PROTOCOL 0{step + 1}</span>
               <h1 className="mt-2 text-4xl lg:text-5xl font-black tracking-tighter uppercase text-foreground leading-none">{steps[step]}</h1>
            </header>

            <div className="space-y-10">
              <div className={cn("space-y-8", step !== 0 && "hidden")}>
                <ConfigField label="MISSION NAME" description="Identify this planning sector.">
                   <Input autoFocus name="name" placeholder="Summer break 2026" className="h-12 bg-surface font-bold uppercase tracking-wide border-border" />
                </ConfigField>
                <ConfigField label="DESTINATION STRATEGY">
                   <Select value={destinationMode} onChange={(event) => setDestinationMode(event.target.value as "known" | "recommend")} className="h-12 bg-surface font-bold uppercase tracking-wide border-border">
                      <option value="known">MANUAL ENTRY</option>
                      <option value="recommend">AI RECOMMENDATION</option>
                   </Select>
                </ConfigField>
                <div className="grid gap-6 lg:grid-cols-2">
                   <ConfigField label="CITY">
                      <Input name="destination" disabled={destinationMode === "recommend"} className="h-12 bg-surface border-border font-bold uppercase" placeholder="e.g. Tokyo" />
                   </ConfigField>
                   <ConfigField label="COUNTRY">
                      <Input name="destinationCountry" className="h-12 bg-surface border-border font-bold uppercase" placeholder="e.g. Japan" />
                   </ConfigField>
                </div>
              </div>

              <div className={cn("space-y-8", step !== 1 && "hidden")}>
                <ConfigField label="DEPARTURE ORIGIN">
                   <Input name="departureCity" className="h-12 bg-surface border-border font-bold uppercase" placeholder="NYC, London, etc." />
                </ConfigField>
                <div className="grid gap-6 lg:grid-cols-2">
                   <ConfigField label="START DATE">
                      <Input name="startDate" type="date" className="h-12 bg-surface border-border font-bold" />
                   </ConfigField>
                   <ConfigField label="END DATE">
                      <Input name="endDate" type="date" className="h-12 bg-surface border-border font-bold" />
                   </ConfigField>
                </div>
                <ConfigField label="TOTAL TRAVELERS">
                   <Input name="travelerCount" type="number" defaultValue={1} className="h-12 bg-surface border-border font-bold" />
                </ConfigField>
              </div>

              <div className={cn("space-y-8", step !== 2 && "hidden")}>
                <ConfigField label="GLOBAL CAPITAL POOL" description="Allocated budget for this journey.">
                   <Input name="budget" type="number" className="h-14 bg-surface border-border text-2xl font-black" placeholder="0.00" />
                </ConfigField>
                <div className="grid gap-6 lg:grid-cols-2">
                   <ConfigField label="TRAVEL STYLE">
                      <Select name="travelStyle" defaultValue="balanced" className="h-12 bg-surface border-border font-bold uppercase">
                         {["relaxed", "balanced", "adventure", "luxury", "family", "romantic", "cultural"].map((style) => <option key={style} value={style}>{style.toUpperCase()}</option>)}
                      </Select>
                   </ConfigField>
                   <ConfigField label="DAILY PACE">
                      <Select name="pace" defaultValue="medium" className="h-12 bg-surface border-border font-bold uppercase">
                         {["slow", "medium", "packed"].map((pace) => <option key={pace} value={pace}>{pace.toUpperCase()}</option>)}
                      </Select>
                   </ConfigField>
                </div>
              </div>

              <div className={cn("space-y-10", step !== 3 && "hidden")}>
                <div className="flex flex-wrap gap-2">
                   {interestsList.map((interest) => (
                     <label key={interest} className="group flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all hover:border-black has-[:checked]:bg-black has-[:checked]:text-white shadow-sm">
                        <input name="interests" value={interest} type="checkbox" className="hidden" />
                        {interest}
                     </label>
                   ))}
                </div>
                <ConfigField label="INTERNAL MEMO" description="Custom logic and planning requirements.">
                   <Textarea name="notes" className="min-h-32 bg-surface border-border p-4 text-sm font-medium leading-relaxed" placeholder="e.g. Prioritize photography spots and local coffee culture..." />
                </ConfigField>
              </div>

              <div className={cn("space-y-6", step !== 4 && "hidden")}>
                <div className="rounded-2xl border-2 border-dashed border-border bg-surface p-12 text-center">
                   <ShieldCheck size={48} className="mx-auto text-emerald-500 mb-6" strokeWidth={1.5} />
                   <h3 className="text-xl font-bold uppercase tracking-tight">System Ready</h3>
                   <p className="mt-4 text-xs font-medium text-muted leading-relaxed max-w-sm mx-auto uppercase tracking-widest">
                      Commit this brief to initialize the workspace. The discovery engine will trigger automatically.
                   </p>
                   <TripSubmitButton />
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-20 flex items-center justify-between border-t border-border pt-10">
            <button 
              type="button" 
              onClick={() => setStep((current) => Math.max(0, current - 1))} 
              disabled={step === 0} 
              className="flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-5 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-black disabled:opacity-30 transition-all"
            >
              <ArrowLeft size={12} /> BACK
            </button>
            
            {step < steps.length - 1 && (
              <button 
                type="button" 
                onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))} 
                className="flex h-10 items-center gap-2 rounded-md bg-black px-6 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg hover:bg-zinc-800 transition-all"
              >
                CONTINUE <ArrowRight size={12} />
              </button>
            )}
          </footer>
        </form>
      </main>

      {pendingDelete && (
        <DeleteTripDialog
          trip={pendingDelete}
          busy={isPending}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDeleteTrip}
        />
      )}
    </div>
  );
}

function DeleteTripDialog({
  trip,
  busy,
  onCancel,
  onConfirm,
}: {
  trip: NonNullable<PendingDelete>;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="delete-trip-title">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-md border border-rose-200 bg-rose-50 text-rose-600">
            <Trash2 size={16} />
          </div>
          <div className="min-w-0">
            <h2 id="delete-trip-title" className="text-sm font-bold text-foreground">
              Delete {trip.isActive ? "active trip" : "journey"}?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-2">
              “{trip.name}” and its itinerary, saved places, bookings, notes, and expenses will be removed permanently.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-10 rounded-md border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-rose-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            Delete trip
          </button>
        </div>
      </div>
    </div>
  );
}

function BriefItem({ icon: Icon, label, value }: { icon: LucideIcon, label: string, value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
       <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-muted">
          <Icon size={10} /> {label}
       </div>
       <p className="text-[10px] font-bold text-foreground truncate uppercase">{value}</p>
    </div>
  );
}

function ConfigField({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
       <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground">{label}</label>
          {description && <p className="text-[10px] font-medium text-muted uppercase tracking-wider">{description}</p>}
       </div>
       {children}
    </div>
  );
}

function TripSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className="mt-10 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-black text-xs font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-all hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-70"
    >
      <WandSparkles size={18} />
      {pending ? "Initializing sector" : "Commit Protocol"}
    </button>
  );
}

function TripPreparingOverlay() {
  const { pending } = useFormStatus();
  if (!pending) return null;

  return (
    <div className="absolute inset-6 z-20 grid place-items-center rounded-2xl border border-border bg-background/95 p-6 text-center backdrop-blur lg:inset-12">
      <div className="max-w-sm">
        <WandSparkles className="mx-auto size-8 animate-pulse text-foreground" />
        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Initializing sector</p>
        <h2 className="mt-3 text-2xl font-black tracking-tight">Creating your trip brief</h2>
        <p className="mt-4 text-sm leading-6 text-muted">
          We are saving the trip and preparing destination ideas plus live places before opening Discover.
        </p>
      </div>
    </div>
  );
}
