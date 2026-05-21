import Link from "next/link";
import { 
  CloudSun, 
  MapPin, 
  Sparkles,
  Ticket,
  Clock,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Wallet,
  ArrowRight,
  HardDrive,
  CheckSquare,
  FileText,
  LucideIcon
} from "lucide-react";
import { NearbyIdeasCard } from "@/components/travel/nearby-ideas-card";
import { TodayWorkspace } from "@/components/travel/today-workspace";
import { getWeatherSummary } from "@/lib/api/weatherService";
import { getPrimaryTrip, toItineraryDays, toPlaceRecommendations } from "@/lib/db/travel";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const trip = await getPrimaryTrip();
  
  if (!trip) {
    return <NoTripState />;
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  
  // Normalize dates to start of day for comparison
  const dToday = new Date(`${todayStr}T00:00:00Z`);
  const dStart = new Date(startDate.toISOString().slice(0, 10) + "T00:00:00Z");
  const dEnd = new Date(endDate.toISOString().slice(0, 10) + "T00:00:00Z");

  let state: "before" | "during" | "after" = "during";
  if (dToday < dStart) state = "before";
  else if (dToday > dEnd) state = "after";

  const days = toItineraryDays(trip);
  const places = toPlaceRecommendations(trip);
  const weather = await getWeatherSummary([trip.destination, trip.destinationCountry].filter(Boolean).join(", "));
  
  // Logic for "during" state
  const activeDay = days.find((day) => day.date === todayStr) ?? (state === "during" ? days[0] : null);
  const nextBooking = trip.bookings.find(b => b.startAt && new Date(b.startAt).toISOString().slice(0, 10) === todayStr) || trip.bookings[0];
  
  const spent = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetRemaining = trip.budget - spent;

  if (state === "before") {
    const daysUntil = Math.ceil((dStart.getTime() - dToday.getTime()) / (1000 * 60 * 60 * 24));
    const checklist = trip.bookingChecklist;
    const completedItems = checklist.filter(i => i.status === "done" || i.status === "not_needed").length;
    const missingCrucial = checklist.filter(i => i.status === "needed" && ["flights", "stay"].includes(i.key));

    return (
      <div className="flex h-full w-full flex-col overflow-hidden bg-background">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6 z-30">
          <div className="flex items-center gap-8">
             <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black tracking-widest text-muted uppercase">Deployment Standby</span>
                <span className="text-xl font-bold tracking-tight">{daysUntil} Days Until Departure</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <Link href="/itinerary">
                <button className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-4 text-[10px] font-bold uppercase tracking-widest text-foreground hover:bg-surface transition-all">
                   Finalize Timeline
                </button>
             </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 sm:p-12 lg:p-24 scrollbar-hide">
           <div className="mx-auto max-w-4xl space-y-12">
              <section className="grid gap-8 lg:grid-cols-2">
                 <div className="space-y-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Ready for Takeoff?</span>
                    <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none">
                       {trip.destination || "The Journey"} <br/> <span className="text-muted/40">is approaching</span>
                    </h1>
                    <p className="text-sm font-bold text-muted uppercase tracking-widest leading-relaxed">
                       {new Date(trip.startDate).toLocaleDateString("en-US", { month: 'long', day: 'numeric' })} — {new Date(trip.endDate).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                 </div>

                 <div className="rounded-2xl border-2 border-foreground p-8 flex flex-col justify-between bg-background shadow-2xl">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-4">Readiness Score</p>
                       <p className="text-5xl font-black text-foreground">{Math.round((completedItems / checklist.length) * 100)}%</p>
                       <p className="mt-2 text-[10px] font-bold uppercase text-muted tracking-widest">{completedItems} of {checklist.length} items cleared</p>
                    </div>
                    <div className="mt-8 space-y-3">
                       {missingCrucial.map(item => (
                         <div key={item.id} className="flex items-center gap-2 text-[10px] font-black text-rose-600 uppercase tracking-widest">
                            <AlertTriangle size={12} /> Missing: {item.label}
                         </div>
                       ))}
                    </div>
                 </div>
              </section>

              <section className="grid gap-6 sm:grid-cols-3">
                 <PreparingCard 
                    title="Itinerary" 
                    status={trip.status === "itinerary_approved" ? "Approved" : "Planning"} 
                    icon={Calendar} 
                    href="/itinerary"
                    done={trip.status === "itinerary_approved"}
                 />
                 <PreparingCard 
                    title="Bookings" 
                    status={`${trip.bookings.length} Records`} 
                    icon={Ticket} 
                    href="/bookings"
                    done={trip.bookings.length > 0}
                 />
                 <PreparingCard 
                    title="Documents" 
                    status={`${trip.documentNotes.length} Stored`} 
                    icon={FileText} 
                    href="/documents"
                    done={trip.documentNotes.length > 0}
                 />
              </section>

              <section className="rounded-xl border border-border bg-surface/30 p-8">
                 <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                    <CheckSquare size={14} /> Planning Checklist
                 </h3>
                 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {checklist.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border shadow-sm">
                         <div className={cn("size-2 rounded-full", item.status === "done" ? "bg-emerald-500" : item.status === "not_needed" ? "bg-muted/40" : "bg-rose-500")} />
                         <span className="text-[10px] font-bold uppercase tracking-tight truncate">{item.label}</span>
                      </div>
                    ))}
                 </div>
              </section>
           </div>
        </main>
      </div>
    );
  }

  if (state === "after") {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden bg-background">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6 z-30">
          <div className="flex items-center gap-8">
             <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black tracking-widest text-muted uppercase">Mission Summary</span>
                <span className="text-xl font-bold tracking-tight">Trip Completed</span>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 sm:p-12 lg:p-24 scrollbar-hide">
           <div className="mx-auto max-w-3xl space-y-16">
              <section className="text-center space-y-6">
                 <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-inner">
                    <CheckCircle2 size={40} />
                 </div>
                 <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter">Welcome Back</h1>
                 <p className="text-sm font-bold text-muted uppercase tracking-widest">
                    Your journey to {trip.destination} has concluded.
                 </p>
              </section>

              <div className="grid gap-6 sm:grid-cols-2">
                 <Link href="/memories" className="group p-8 rounded-2xl border border-border bg-background hover:border-black transition-all shadow-sm">
                    <HardDrive size={32} className="mb-4 text-muted group-hover:text-foreground transition-colors" />
                    <h3 className="text-lg font-black uppercase tracking-tight">Preserve Memories</h3>
                    <p className="mt-2 text-xs font-bold text-muted uppercase tracking-widest">Archive photos and highlights in the cloud</p>
                 </Link>
                 <Link href="/budget" className="group p-8 rounded-2xl border border-border bg-background hover:border-black transition-all shadow-sm">
                    <Wallet size={32} className="mb-4 text-muted group-hover:text-foreground transition-colors" />
                    <h3 className="text-lg font-black uppercase tracking-tight">Expense Audit</h3>
                    <p className="mt-2 text-xs font-bold text-muted uppercase tracking-widest">Total spent: {formatCurrency(spent, trip.currency)}</p>
                 </Link>
              </div>

              <section className="rounded-xl border border-amber-200 bg-amber-50/30 p-8 flex items-center justify-between gap-6">
                 <div className="flex items-start gap-4">
                    <AlertTriangle className="text-amber-600 mt-1 shrink-0" size={20} />
                    <div>
                       <h4 className="text-sm font-black uppercase tracking-widest text-amber-900">Document Cleanup</h4>
                       <p className="mt-1 text-xs font-medium text-amber-800/70 leading-relaxed uppercase tracking-tight">
                          Consider removing sensitive document scans if they are no longer required for this completed trip.
                       </p>
                    </div>
                 </div>
                 <Link href="/documents">
                    <button className="h-10 rounded-lg border border-amber-500/20 bg-amber-500/10 px-6 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 hover:bg-amber-500/20 transition-all">Clean Archive</button>
                 </Link>
              </section>
           </div>
        </main>
      </div>
    );
  }

  // "During" State
  if (!activeDay) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 opacity-50">
        <Sparkles size={48} strokeWidth={1} />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em]">No itinerary segments active for today</p>
        <Link href="/itinerary" className="mt-6">
           <button className="h-9 border border-border px-6 text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-surface transition-all">View Timeline</button>
        </Link>
      </div>
    );
  }

  const nextPlace = activeDay.places?.find(p => !p.timeOfDay || parseInt(p.timeOfDay) > now.getHours());
  const indoorBackup = activeDay.backupOption || "Check local museums or galleries.";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* 1. Header Command Area */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6 z-30">
        <div className="flex items-center gap-8">
           <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black tracking-widest text-muted uppercase">In Progress</span>
              <span className="text-xl font-bold tracking-tight">{formatDate(activeDay.date)}</span>
           </div>
           <div className="h-8 w-px bg-border/50 hidden sm:block" />
           <div className="hidden items-center gap-4 sm:flex">
              <article className="flex items-center gap-3">
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted">Telemetry Synced</span>
                 <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              </article>
           </div>
        </div>

        <div className="flex items-center gap-3">
           <Link href="/itinerary">
              <button className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-4 text-[10px] font-bold uppercase tracking-widest text-foreground hover:bg-surface transition-all shadow-sm">
                 Full Timeline
              </button>
           </Link>
           <button className="flex h-9 items-center gap-2 rounded-md bg-foreground px-4 text-[10px] font-bold uppercase tracking-widest text-background hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xl">
              <Sparkles size={12} /> Logical Studio
           </button>
        </div>
      </header>

      {/* 2. Content Workspace */}
      <main className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left: Agenda Timeline */}
        <section className="flex-1 overflow-y-auto p-8 lg:p-12 xl:p-16 bg-background border-r border-border scrollbar-hide">
           <div className="max-w-3xl mx-auto space-y-12">
              <header>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Daily Theme</span>
                 <h1 className="mt-4 text-4xl lg:text-6xl font-black tracking-tighter uppercase text-foreground leading-none">{activeDay.theme}</h1>
              </header>

              <div className="space-y-12">
                 <AgendaNode marker="08:00" title="MORNING" content={activeDay.morningPlan} />
                 <AgendaNode marker="13:00" title="AFTERNOON" content={activeDay.afternoonPlan} />
                 <AgendaNode marker="19:00" title="EVENING" content={activeDay.eveningPlan} />
              </div>

              {activeDay.notes && (
                <section className="rounded-xl border border-border bg-surface-2 p-6 italic text-muted-2 text-sm leading-relaxed">
                   {activeDay.notes}
                </section>
              )}

              {nextPlace && (
                <section className="rounded-2xl border-2 border-foreground p-8 bg-background shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">

                   <div className="flex items-center gap-6">
                      <div className="grid size-12 place-items-center rounded-xl bg-foreground text-background">

                         <MapPin size={24} />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted">Next Objective</p>
                         <h3 className="text-2xl font-black uppercase tracking-tight">{nextPlace.title}</h3>
                         {nextPlace.place?.location && <p className="text-xs font-bold text-muted uppercase tracking-widest">{nextPlace.place.location}</p>}
                      </div>
                   </div>
                   {nextPlace.place?.coordinates && (
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${nextPlace.place.coordinates.lat},${nextPlace.place.coordinates.lng}`}
                        target="_blank"
                        className="w-full sm:w-auto"
                      >
                        <button className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-foreground px-6 text-[10px] font-black uppercase tracking-widest text-background hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all">
                           Navigate <ArrowRight size={14} />
                        </button>
                      </a>
                   )}
                </section>
              )}
           </div>
        </section>

        {/* Right: Intelligence Rail */}
        <aside className="w-full lg:w-[400px] shrink-0 overflow-y-auto bg-surface p-6 lg:p-8 space-y-10 scrollbar-hide pb-20">
           {/* Dynamic Weather Widget */}
           <section>
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">Live Telemetry</h3>
                 <CloudSun size={12} className="text-muted" />
              </div>
              <div className="relative rounded-xl border border-border bg-gradient-to-br from-slate-900 to-black p-6 shadow-xl text-white overflow-hidden">
                 {weather.daily.length > 0 ? (
                   <>
                     <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-10">
                        <CloudSun size={120} />
                     </div>
                     <div className="relative z-10">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">{weather.destination || "Global"}</span>
                        </div>
                        <div className="mt-4 flex items-end gap-4">
                           <span className="text-6xl font-black tracking-tighter leading-none">{weather.daily[0]?.maxC ?? "--"}°</span>
                           <div className="pb-1">
                              <p className="text-sm font-bold tracking-tight">{weather.daily[0]?.label ?? "Unknown"}</p>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mt-0.5">
                                 H: {weather.daily[0]?.maxC ?? "--"}° L: {weather.daily[0]?.minC ?? "--"}° • Rain: {weather.daily[0]?.rainChance ?? "0"}%
                              </p>
                           </div>
                        </div>
                     </div>
                   </>
                 ) : (
                   <div className="py-12 text-center opacity-40">
                      <p className="text-[10px] font-black uppercase tracking-widest">Weather unavailable</p>
                   </div>
                 )}
              </div>
           </section>

           {/* Budget Widget */}
           <section>
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">Operational Budget</h3>
                 <Wallet size={12} className="text-muted" />
              </div>
              <div className="rounded-xl border border-border bg-background p-5 shadow-sm space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted uppercase">Remaining</span>
                    <span className={cn("text-xl font-black", budgetRemaining < 0 ? "text-rose-600" : "text-foreground")}>
                       {formatCurrency(budgetRemaining, trip.currency)}
                    </span>
                 </div>
                 <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full bg-foreground transition-all", budgetRemaining < 0 && "bg-rose-500")}
 
                      style={{ width: `${Math.min(100, (spent / trip.budget) * 100)}%` }}
                    />
                 </div>
                 <p className="text-[9px] font-bold uppercase tracking-widest text-muted text-center">
                    Spent {formatCurrency(spent, trip.currency)} of {formatCurrency(trip.budget, trip.currency)}
                 </p>
              </div>
           </section>

           {/* Logistics Widget */}
           <section>
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">Today&apos;s Logistics</h3>
                 <Ticket size={12} className="text-muted" />
              </div>
              {nextBooking ? (
                <article className="rounded-xl border border-border bg-background p-5 shadow-sm">
                   <h4 className="text-xs font-bold uppercase tracking-tight">{nextBooking.title}</h4>
                   <p className="mt-1 text-[10px] font-medium text-muted uppercase tracking-widest">{nextBooking.provider || "N/A"}</p>
                   <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <span className="text-[10px] font-bold text-foreground uppercase">Confirmation</span>
                      <span className="text-[10px] font-mono font-bold text-muted">{nextBooking.confirmationNumber || "---"}</span>
                   </div>
                </article>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-center opacity-40 bg-background/50">
                   <p className="text-[10px] font-bold uppercase tracking-widest">No segments identified</p>
                </div>
              )}
           </section>

           {/* Adjustment Control */}
           <section>
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">Logical Studio</h3>
                 <Sparkles size={12} className="text-muted" />
              </div>
              <div className="rounded-xl border border-border bg-background overflow-hidden shadow-sm p-4">
                 <TodayWorkspace day={activeDay} />
              </div>
           </section>

           {/* Backup Intel */}
           <section className="rounded-xl border border-border bg-surface-2 p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                 <ShieldCheck size={12} /> Contingency Protocol
              </h3>
              <p className="text-xs font-bold text-muted-2 leading-relaxed uppercase tracking-tight italic">
                 “{indoorBackup}”
              </p>
           </section>

           {/* Nearby Intelligence */}
           <section className="pb-12">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">Exploration Sync</h3>
                 <MapPin size={12} className="text-muted" />
              </div>
              <NearbyIdeasCard places={places} />
           </section>
        </aside>

      </main>

      {/* 3. Global Status Rail */}
      <footer className="flex h-10 shrink-0 items-center justify-between border-t border-border bg-surface px-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted z-30">
         <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><ShieldCheck size={12} className="text-emerald-500" /> SECURE HANDOFF</span>
            <span className="flex items-center gap-2 font-bold text-foreground uppercase tracking-wider">{trip.destination} SECTOR ACTIVE</span>
         </div>
         <div className="hidden items-center gap-6 sm:flex">
            <span>STATUS: {state.toUpperCase()} MISSION</span>
         </div>
      </footer>
    </div>
  );
}

function PreparingCard({ title, status, icon: Icon, href, done }: { title: string, status: string, icon: LucideIcon, href: string, done: boolean }) {
  return (
    <Link href={href} className="group relative flex flex-col justify-between rounded-xl border border-border bg-background p-6 hover:border-black transition-all shadow-sm">
       <div className="flex items-center justify-between mb-4">
          <div className={cn("grid size-10 place-items-center rounded-lg border border-border transition-colors", done ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-surface-2 text-muted")}>
             <Icon size={18} />
          </div>
          <ChevronRight size={14} className="text-muted group-hover:text-foreground transition-colors" />
       </div>
       <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted">{title}</p>
          <p className="mt-1 text-sm font-black uppercase tracking-tight">{status}</p>
       </div>
    </Link>
  );
}

function AgendaNode({ marker, title, content }: { marker: string, title: string, content?: string }) {
  return (
    <div className="relative pl-32 before:absolute before:left-[11px] before:top-8 before:h-full before:w-px before:bg-border last:before:hidden">
       <span className="absolute left-0 top-1 text-[11px] font-black font-mono text-muted tracking-widest">{marker}</span>
       <div className="absolute left-[8px] top-1.5 size-2 rounded-full bg-foreground ring-4 ring-background" />
       
       <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{title}</p>
          <p className="text-2xl font-bold leading-relaxed text-foreground tracking-tight">
             {content || "No operational requirements scheduled for this phase."}
          </p>
       </div>
    </div>
  );
}

function NoTripState() {
  return (
    <div className="flex h-full items-center justify-center p-12">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-surface-2 ring-1 ring-border">
           <Clock size={32} strokeWidth={1.5} className="text-muted" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tighter">Agenda Standby</h1>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted leading-relaxed">
          Create a trip brief to initialize your daily timeline and live telemetry.
        </p>
        <Link href="/trips">
          <button className="mt-8 h-11 rounded-lg bg-foreground px-8 text-xs font-black uppercase tracking-widest text-background hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all">
            Establish Brief
          </button>
        </Link>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
}

