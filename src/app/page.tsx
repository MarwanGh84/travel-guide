/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { 
  ChevronRight, 
  Sparkles, 
  Activity, 
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Calendar,
  Plane,
  CreditCard
} from "lucide-react";
import { getWeatherSummary } from "@/lib/api/weatherService";
import { getExchangeRate } from "@/lib/api/currencyService";
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
  
  const exchangeRate = dbTrip?.currency && dbTrip.currency !== "USD" 
    ? await getExchangeRate("USD", dbTrip.currency)
    : null;

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

  // Calculate Planning Progress
  const hasSavedPlaces = selectedPlaces.length > 0;
  const hasItinerary = days.length > 0;
  const isApproved = !!dbTrip?.itineraryApprovedAt;
  const hasStays = dbTrip?.bookings.some(b => b.type.toLowerCase().includes("stay") || b.type.toLowerCase().includes("hotel")) ?? false;
  const hasBookings = (dbTrip?.bookings.length ?? 0) > 0;

  const steps = [
    { label: "Brief", status: "done", href: "/trips" },
    { label: "Discover", status: hasSavedPlaces ? "done" : "current", href: "/discover" },
    { label: "Saved Places", status: hasSavedPlaces ? "done" : (hasSavedPlaces ? "done" : "current"), href: "/discover" },
    { label: "Itinerary", status: isApproved ? "done" : (hasItinerary ? "done" : (hasSavedPlaces ? "current" : "pending")), href: "/itinerary" },
    { label: "Approved", status: isApproved ? "done" : (hasItinerary ? "current" : "pending"), href: "/itinerary" },
    { label: "Stays", status: hasStays ? "done" : (isApproved ? "current" : "pending"), href: "/stays" },
    { label: "Bookings", status: hasBookings ? "done" : (hasStays ? "current" : "pending"), href: "/bookings" },
    { label: "Travel Ready", status: hasBookings ? "done" : "pending", href: "/today" },
  ];

  const nextStep = steps.find(s => s.status === "current") || steps.find(s => s.status === "pending") || steps[steps.length - 1];

  const warnings = [
    !hasSavedPlaces && { id: "no-places", label: "No saved places yet", href: "/discover" },
    !isApproved && hasItinerary && { id: "not-approved", label: "Itinerary needs approval", href: "/itinerary" },
    !hasItinerary && { id: "no-itinerary", label: "Itinerary not built", href: "/itinerary" },
    !hasBookings && { id: "no-bookings", label: "No bookings added", href: "/bookings" },
    weather.summary.toLowerCase().includes("unavailable") && { id: "weather", label: "Weather intel limited" },
    exchangeRate?.source.isMock && { id: "currency", label: "Currency data fallback" },
  ].filter((w): w is { id: string, label: string, href?: string } => !!w);

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-background p-8">
      {/* 1. Header Command Area */}
      <header className="mb-6 flex items-end justify-between">
        <div>
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
              <Activity size={10} className="text-black" />
              Active Trip Intelligence
           </div>
           <h1 className="mt-2 text-5xl font-black tracking-tighter uppercase leading-none">{trip.destination ?? trip.name}</h1>
           <div className="mt-4 flex items-center gap-6 text-xs font-bold text-muted">
              <span className="flex items-center gap-2"><Calendar size={14} /> {trip.startDate} — {trip.endDate}</span>
              <div className="h-4 w-px bg-border" />
              <span className="flex items-center gap-2"><MapPin size={14} /> {trip.destinationCountry}</span>
              <div className="h-4 w-px bg-border" />
              <span className="flex items-center gap-2"><Sparkles size={14} /> {selectedPlaces.length} SAVED</span>
              <div className="h-4 w-px bg-border" />
              <span className="flex items-center gap-2"><Plane size={14} /> {dbTrip?.bookings.length ?? 0} BOOKINGS</span>
              <div className="h-4 w-px bg-border" />
              <span className="text-foreground flex items-center gap-2"><CreditCard size={14} /> {formatCurrency(trip.budget)} TOTAL POOL</span>
           </div>
        </div>
        
        <Link href={nextStep.href}>
          <button className="flex h-12 items-center gap-3 rounded-lg bg-black px-6 text-xs font-bold uppercase tracking-[0.1em] text-white shadow-xl hover:translate-y-[-2px] transition-all">
            Continue Planning <ArrowRight size={14} />
          </button>
        </Link>
      </header>

      {/* Trip Flow Progress Strip */}
      <div className="mb-10 flex items-center justify-between rounded-xl border border-border bg-surface p-4 shadow-sm">
        {steps.map((step, i) => (
          <div key={step.label} className="flex flex-1 items-center last:flex-none">
            <Link href={step.href} className="group flex flex-col items-center gap-2">
              <div className={`flex size-8 items-center justify-center rounded-full border-2 transition-all ${
                step.status === "done" ? "bg-black border-black text-white" :
                step.status === "current" ? "border-black bg-white text-black animate-pulse" :
                "border-border bg-background text-muted"
              }`}>
                {step.status === "done" ? <CheckCircle2 size={16} /> : 
                 step.status === "current" ? <Clock size={16} /> : 
                 <span className="text-[10px] font-black">{i + 1}</span>}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${
                step.status === "done" ? "text-black" :
                step.status === "current" ? "text-black" :
                "text-muted"
              }`}>{step.label}</span>
            </Link>
            {i < steps.length - 1 && (
              <div className={`mx-4 h-px flex-1 ${step.status === "done" ? "bg-black" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

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
          <section className="col-span-5 row-span-3 flex flex-col rounded-2xl border border-border bg-surface overflow-hidden">
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

          {/* Needs Attention Panel */}
          <section className="col-span-5 row-span-1 flex flex-col rounded-2xl border border-border bg-surface-2 overflow-hidden">
             <div className="flex h-8 shrink-0 items-center border-b border-border bg-background/50 px-4">
                <span className="text-[8px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                   <AlertCircle size={10} className="text-black" />
                   Needs Attention
                </span>
             </div>
             <div className="flex-1 p-3 flex gap-2 overflow-x-auto no-scrollbar">
                {warnings.length > 0 ? warnings.map((warning) => (
                  <div key={warning.id} className="flex h-full min-w-[140px] items-center gap-2 rounded-lg border border-border bg-background p-2 shadow-sm">
                     <AlertCircle size={12} className="text-black shrink-0" />
                     <div className="min-w-0">
                        <p className="truncate text-[9px] font-bold uppercase tracking-tight">{warning.label}</p>
                        {warning.href && (
                          <Link href={warning.href} className="text-[8px] font-black text-muted hover:text-black uppercase">Fix Now</Link>
                        )}
                     </div>
                  </div>
                )) : (
                  <div className="flex w-full items-center justify-center gap-2 text-muted">
                     <CheckCircle2 size={12} className="text-green-600" />
                     <span className="text-[9px] font-black uppercase tracking-widest">System Nominal</span>
                  </div>
                )}
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

