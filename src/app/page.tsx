/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { 
  ChevronRight, 
  Sparkles, 
  Activity,
  ArrowRight
} from "lucide-react";
import { getWeatherSummary } from "@/lib/api/weatherService";
import {
  getPrimaryTrip,
  toItineraryDays,
  toSelectedPlaceRecommendations,
  toTripDraft,
} from "@/lib/db/travel";
import { imageForDestination, imageForPlace } from "@/lib/travel/media";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dbTrip = await getPrimaryTrip();
  const trip = dbTrip ? toTripDraft(dbTrip) : null;
  const selectedPlaces = dbTrip ? toSelectedPlaceRecommendations(dbTrip) : [];
  const days = dbTrip ? toItineraryDays(dbTrip) : [];
  const weather = await getWeatherSummary([trip?.destination, trip?.destinationCountry].filter(Boolean).join(", "));
  const actual = dbTrip?.budgetCategories.reduce((sum, item) => sum + item.actualAmount, 0) ?? 0;
  const remaining = (trip?.budget ?? 0) - actual;

  if (!trip) {
    return (
      <section className="flex h-full items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-surface-2 ring-1 ring-border">
             <Sparkles size={32} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Design your journey.</h1>
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Initialize your trip profile to unlock the high-density itinerary builder, AI discovery, and automated budgeting tool.
          </p>
          <Link href="/trips">
            <button className="mt-8 h-11 rounded-lg bg-black px-8 text-xs font-bold uppercase tracking-widest text-white hover:bg-zinc-800 transition-all">
              Initialize Workspace
            </button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background p-8">
      {/* 1. Header Command Area */}
      <header className="mb-10 flex items-end justify-between">
        <div>
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
              <Activity size={10} className="text-black" />
              Active Trip Intelligence
           </div>
           <h1 className="mt-2 text-5xl font-black tracking-tighter uppercase">{trip.destination ?? trip.name}</h1>
           <div className="mt-4 flex items-center gap-6 text-xs font-bold text-muted">
              <span>{trip.startDate} — {trip.endDate}</span>
              <div className="h-4 w-px bg-border" />
              <span>{days.length} DAYS PLANNED</span>
              <div className="h-4 w-px bg-border" />
              <span className="text-foreground">{formatCurrency(trip.budget)} TOTAL POOL</span>
           </div>
        </div>
        
        <Link href="/itinerary">
          <button className="flex h-12 items-center gap-3 rounded-lg bg-black px-6 text-xs font-bold uppercase tracking-[0.1em] text-white shadow-xl hover:translate-y-[-2px] transition-all">
            Launch Workspace <ArrowRight size={14} />
          </button>
        </Link>
      </header>

      {/* 2. High-Density Grid */}
      <main className="flex-1 min-h-0">
        <div className="grid h-full grid-cols-12 grid-rows-6 gap-6">
          
          {/* Main Visual - The Destination */}
          <section className="relative col-span-7 row-span-4 overflow-hidden rounded-2xl border border-border shadow-sm">
             <img src={imageForDestination(trip.destination, trip.destinationCountry, 1200, 800)} alt="" className="h-full w-full object-cover grayscale-[0.2] brightness-[0.8]" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
             <div className="absolute bottom-8 left-8 text-white">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Climate Overview</p>
                <div className="mt-2 flex items-center gap-4">
                   <span className="text-5xl font-black tracking-tighter">{weather.temperatureRange}</span>
                   <div className="text-xs font-bold">
                      <p>{weather.summary}</p>
                      <p className="opacity-60">{weather.rainRisk} Rain Chance</p>
                   </div>
                </div>
             </div>
          </section>

          {/* Daily Digest - High Density List */}
          <section className="col-span-5 row-span-4 flex flex-col rounded-2xl border border-border bg-surface overflow-hidden">
             <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-5">
                <span className="text-[10px] font-black uppercase tracking-widest">Upcoming Timeline</span>
                <Link href="/itinerary" className="text-[10px] font-bold text-muted hover:text-black">VIEW ALL</Link>
             </div>
             <div className="flex-1 overflow-y-auto divide-y divide-border/40">
                {days.slice(0, 6).map((day, i) => (
                  <div key={day.id} className="group flex items-center gap-4 p-4 hover:bg-background transition-colors cursor-default">
                     <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-background border border-border text-[10px] font-black">
                        0{i + 1}
                     </span>
                     <div className="min-w-0 flex-1">
                        <h4 className="truncate text-xs font-bold uppercase tracking-tight">{day.theme}</h4>
                        <p className="mt-1 truncate text-[10px] text-muted leading-relaxed font-medium">{day.morningPlan}</p>
                     </div>
                     <ChevronRight size={12} className="text-border group-hover:text-black transition-colors" />
                  </div>
                ))}
             </div>
          </section>

          {/* Budget Snapshot */}
          <section className="col-span-3 row-span-2 flex flex-col justify-between rounded-2xl border border-border bg-background p-6 shadow-sm">
             <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">Capital Utilization</span>
                <div className="mt-4 flex items-baseline gap-2">
                   <span className="text-3xl font-black tracking-tight">{formatCurrency(actual)}</span>
                   <span className="text-[10px] font-bold text-muted">SPENT</span>
                </div>
             </div>
             <div className="space-y-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2 border border-border">
                   <div className="h-full bg-black transition-all" style={{ width: `${Math.min(100, (actual / (trip.budget || 1)) * 100)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted">
                   <span>Remaining Pool</span>
                   <span className="text-foreground">{formatCurrency(remaining)}</span>
                </div>
             </div>
          </section>

          {/* Curated Selection Gallery */}
          <section className="col-span-9 row-span-2 flex flex-col rounded-2xl border border-border bg-surface overflow-hidden">
             <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-5">
                <span className="text-[10px] font-black uppercase tracking-widest">Discovery Stack</span>
                <Link href="/discover" className="text-[10px] font-bold text-muted hover:text-black">MANAGE SELECTION</Link>
             </div>
             <div className="flex-1 flex gap-px bg-border/40">
                {selectedPlaces.slice(0, 5).map((place) => (
                  <div key={place.id} className="relative flex-1 group overflow-hidden bg-background first:rounded-bl-xl last:rounded-br-xl">
                     <img src={imageForPlace(place)} alt="" className="h-full w-full object-cover grayscale brightness-[0.7] group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500" />
                     <div className="absolute inset-0 flex flex-col justify-end p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <h4 className="text-[10px] font-bold uppercase truncate">{place.name}</h4>
                        <p className="mt-1 text-[8px] font-medium tracking-[0.1em] opacity-60 uppercase">{place.category}</p>
                     </div>
                  </div>
                ))}
                {selectedPlaces.length === 0 && (
                  <div className="flex-1 flex items-center justify-center p-8 text-center text-muted">
                     <p className="text-[10px] font-bold uppercase tracking-widest">Empty Stack</p>
                  </div>
                )}
             </div>
          </section>

        </div>
      </main>

      {/* 3. Global Shortcuts Rail */}
      <footer className="mt-8 flex h-10 items-center justify-center gap-12 border-t border-border/50 pt-6">
         <Shortcut label="Timeline" keybind="G+I" href="/itinerary" />
         <Shortcut label="Discovery" keybind="G+D" href="/discover" />
         <Shortcut label="Financials" keybind="G+B" href="/budget" />
         <Shortcut label="Documents" keybind="G+L" href="/documents" />
      </footer>
    </div>
  );
}

function Shortcut({ label, keybind, href }: { label: string; keybind: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 group">
       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted group-hover:text-black transition-colors">{label}</span>
       <span className="rounded border border-border-strong bg-surface px-1.5 py-0.5 text-[8px] font-black text-muted-2">{keybind}</span>
    </Link>
  );
}

