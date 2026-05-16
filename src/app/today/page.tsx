import Link from "next/link";
import { 
  CloudSun, 
  MapPin, 
  Sparkles,
  Ticket,
  RefreshCw,
  Clock,
  ShieldCheck
} from "lucide-react";
import { NearbyIdeasCard } from "@/components/travel/nearby-ideas-card";
import { TodayWorkspace } from "@/components/travel/today-workspace";
import { getWeatherSummary } from "@/lib/api/weatherService";
import { getPrimaryTrip, toItineraryDays, toPlaceRecommendations } from "@/lib/db/travel";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const trip = await getPrimaryTrip();
  
  if (!trip) {
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
            <button className="mt-8 h-11 rounded-lg bg-black px-8 text-xs font-black uppercase tracking-widest text-white hover:bg-zinc-800 transition-all">
              Establish Brief
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const days = toItineraryDays(trip);
  const places = toPlaceRecommendations(trip);
  const currentDate = new Date().toISOString().slice(0, 10);
  const today = days.find((day) => day.date === currentDate) ?? days[0];
  const weather = await getWeatherSummary([trip.destination, trip.destinationCountry].filter(Boolean).join(", "));
  const nextBooking = trip.bookings[0];

  if (!today) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 opacity-50">
        <Sparkles size={48} strokeWidth={1} />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em]">No itinerary segments active</p>
        <Link href="/itinerary" className="mt-6">
           <button className="h-9 border border-border px-6 text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-surface transition-all">Generate Timeline</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* 1. Header Command Area */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6 z-30">
        <div className="flex items-center gap-8">
           <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black tracking-widest text-muted uppercase">Today&apos;s Focus</span>
              <span className="text-xl font-bold tracking-tight">{formatDate(today.date)}</span>
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
           <button className="hidden h-9 items-center gap-2 rounded-md border border-border bg-background px-4 text-[10px] font-bold uppercase tracking-widest text-foreground hover:bg-surface transition-all shadow-sm lg:flex">
              <RefreshCw size={12} /> Sync Weather
           </button>
           <button className="flex h-9 items-center gap-2 rounded-md bg-black px-4 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-zinc-800 transition-all shadow-xl">
              <Sparkles size={12} /> Adjust Day
           </button>
        </div>
      </header>

      {/* 2. Content Workspace */}
      <main className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left: Agenda Timeline */}
        <section className="flex-1 overflow-y-auto p-8 lg:p-12 xl:p-20 bg-background border-r border-border scrollbar-hide">
           <div className="max-w-3xl mx-auto space-y-16">
              <header>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Daily Theme</span>
                 <h1 className="mt-4 text-4xl lg:text-6xl font-black tracking-tighter uppercase text-foreground leading-none">{today.theme}</h1>
              </header>

              <div className="space-y-16 pb-24">
                 <AgendaNode marker="08:00" title="MORNING" content={today.morningPlan} />
                 <AgendaNode marker="13:00" title="AFTERNOON" content={today.afternoonPlan} />
                 <AgendaNode marker="19:00" title="EVENING" content={today.eveningPlan} />
              </div>
           </div>
        </section>

        {/* Right: Intelligence Rail */}
        <aside className="w-full lg:w-[400px] shrink-0 overflow-y-auto bg-surface p-6 lg:p-8 space-y-12 scrollbar-hide">
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
                           <span className="flex h-4 items-center rounded bg-blue-500/20 px-2 text-[8px] font-black uppercase tracking-widest text-blue-300 ring-1 ring-blue-500/30">Live</span>
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
                        
                        <div className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                           {weather.daily.slice(1, 6).map((d) => (
                             <div key={d.date} className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg bg-white/5 border border-white/10 py-3 backdrop-blur-md">
                                <span className="text-[9px] font-black uppercase text-white/60">{new Date(`${d.date}T12:00:00Z`).toLocaleDateString('en-US', {weekday:'short'})}</span>
                                <CloudSun size={14} className="text-white/80" />
                                <span className="text-xs font-bold">{d.maxC}°</span>
                             </div>
                           ))}
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

           {/* Logistics Widget */}
           <section>
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">Active Logistics</h3>
                 <Ticket size={12} className="text-muted" />
              </div>
              {nextBooking ? (
                <article className="rounded-xl border border-border bg-background p-5 shadow-sm">
                   <h4 className="text-xs font-bold uppercase tracking-tight">{nextBooking.title}</h4>
                   <p className="mt-1 text-[10px] font-medium text-muted uppercase tracking-widest">{nextBooking.provider || "N/A"}</p>
                   <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <span className="text-[10px] font-bold text-foreground">CONFIRMATION</span>
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
              <div className="rounded-xl border border-border bg-background overflow-hidden shadow-sm">
                 <TodayWorkspace day={today} />
              </div>
           </section>

           {/* Nearby Intelligence */}
           <section className="pb-12">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">Nearby Intel</h3>
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
            <span>LAST SYNC: {new Date().toLocaleTimeString()}</span>
         </div>
      </footer>
    </div>
  );
}

function AgendaNode({ marker, title, content }: { marker: string, title: string, content?: string }) {
  return (
    <div className="relative pl-32 before:absolute before:left-[11px] before:top-8 before:h-full before:w-px before:bg-border last:before:hidden">
       <span className="absolute left-0 top-1 text-[11px] font-black font-mono text-muted tracking-widest">{marker}</span>
       <div className="absolute left-[8px] top-1.5 size-2 rounded-full bg-black ring-4 ring-background" />
       
       <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{title}</p>
          <p className="text-2xl font-bold leading-relaxed text-foreground tracking-tight">
             {content || "No operational requirements scheduled for this phase."}
          </p>
       </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
}
