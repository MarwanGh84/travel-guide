import Link from "next/link";
import { 
  CloudSun, 
  Navigation, 
  MapPin, 
  Sparkles,
  Ticket,
  RefreshCw,
  Clock
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
    <div className="flex h-full w-full flex-col overflow-hidden lg:flex-row">
      {/* 1. Header Command Area */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6 w-full lg:absolute lg:top-0 lg:z-30 lg:bg-surface/80 lg:backdrop-blur-md">
        <div className="flex items-center gap-8">
           <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black tracking-widest text-muted uppercase">Today&apos;s Focus</span>
              <span className="text-xl font-bold tracking-tight">{formatDate(today.date)}</span>
           </div>
           <div className="h-8 w-px bg-border/50" />
           <div className="flex items-center gap-4">
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
           <Link href="/today" className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-4 text-[10px] font-bold uppercase tracking-widest text-foreground hover:bg-surface transition-all shadow-sm">
              <RefreshCw size={12} /> Refresh Weather
           </Link>
           <a href="#adjustment-panel" className="flex h-9 items-center gap-2 rounded-md bg-black px-4 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-zinc-800 transition-all shadow-xl">
              <Sparkles size={12} /> Adjust Day
           </a>
        </div>
      </header>

      {/* 2. Content Workspace */}
      <main className="flex-1 overflow-hidden flex flex-col lg:flex-row lg:pt-16">
        
        {/* Left: Agenda Timeline */}
        <section className="flex-1 overflow-y-auto p-6 lg:p-12 bg-background border-r border-border">
           <div className="max-w-3xl mx-auto space-y-16">
              <header>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Daily Theme</span>
                 <h1 className="mt-2 text-3xl lg:text-5xl font-black tracking-tighter uppercase">{today.theme}</h1>
              </header>

              <div className="space-y-12 pb-24">
                 <AgendaNode marker="08:00" title="MORNING" content={today.morningPlan} />
                 <AgendaNode marker="13:00" title="AFTERNOON" content={today.afternoonPlan} />
                 <AgendaNode marker="19:00" title="EVENING" content={today.eveningPlan} />
              </div>
           </div>
        </section>

        {/* Right: Intelligence Rail */}
        <aside className="w-full lg:w-[400px] shrink-0 overflow-y-auto bg-surface p-6 lg:p-8 space-y-10">
           {/* Dynamic Weather Widget */}
           <section id="adjustment-panel">
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

           <section>
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">Next Booking</h3>
                 <Ticket size={12} className="text-muted" />
              </div>
              {nextBooking ? (
                <article className="rounded-xl border border-border bg-background p-5 shadow-sm">
                   <h4 className="text-xs font-bold uppercase">{nextBooking.title}</h4>
                   <p className="mt-1 text-[10px] font-medium text-muted uppercase tracking-widest">{nextBooking.provider || "N/A"}</p>
                   <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <span className="text-[10px] font-bold text-foreground">CONFIRMATION</span>
                      <span className="text-[10px] font-mono font-bold text-muted">{nextBooking.confirmationNumber || "---"}</span>
                   </div>
                </article>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-center opacity-40">
                   <p className="text-[10px] font-bold uppercase tracking-widest">No active bookings</p>
                </div>
              )}
           </section>

           <section>
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">Studio Adjustment</h3>
                 <Sparkles size={12} className="text-muted" />
              </div>
              <div className="rounded-xl border border-border bg-background overflow-hidden shadow-sm">
                 <TodayWorkspace day={today} />
              </div>
           </section>

           <section>
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">Local Curation</h3>
                 <MapPin size={12} className="text-muted" />
              </div>
              <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
                 <NearbyIdeasCard places={places} />
              </div>
           </section>
        </aside>

      </main>

      {/* 3. Global Status Rail */}
      <footer className="flex h-10 shrink-0 items-center justify-between border-t border-border bg-surface px-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted">
         <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><Navigation size={12} /> GPS CONNECTED</span>
            <span className="flex items-center gap-2 font-bold text-foreground uppercase tracking-wider">{trip?.destination} BRIEF ACTIVE</span>
         </div>
         <div className="flex items-center gap-6">
            <span>PRESS CMD+K FOR SHORTCUTS</span>
         </div>
      </footer>
    </div>
  );
}

function AgendaNode({ marker, title, content }: { marker: string, title: string, content?: string }) {
  return (
    <div className="relative pl-24 before:absolute before:left-[11px] before:top-8 before:h-full before:w-px before:bg-border last:before:hidden">
       <span className="absolute left-0 top-1 text-[11px] font-black font-mono text-muted">{marker}</span>
       <div className="absolute left-[8px] top-1.5 size-2 rounded-full bg-black ring-4 ring-background" />
       
       <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{title}</p>
          <p className="text-xl font-bold leading-relaxed text-foreground tracking-tight">
             {content || "Nothing scheduled for this window."}
          </p>
       </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
}
