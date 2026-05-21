import Link from "next/link";
import Image from "next/image";
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
          <h1 className="text-3xl font-black tracking-tight text-foreground">Design your journey.</h1>
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Initialize your trip profile to unlock the high-density itinerary builder, AI discovery, and automated budgeting tool.
          </p>
          <Link href="/trips">
            <button className="mt-8 h-11 rounded-lg bg-foreground px-8 text-xs font-bold uppercase tracking-widest text-background hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all">
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
    <div className="flex h-full w-full flex-col overflow-y-auto lg:overflow-hidden bg-background p-4 sm:p-6 lg:p-8">
      {/* 1. Header Command Area */}
      <header className="mb-6 flex shrink-0 flex-col gap-6 lg:mb-8 lg:flex-row lg:items-end lg:justify-between lg:gap-0">
        <div className="min-w-0">
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
              <Activity size={10} className="text-foreground" />
              Trip Intelligence Hub
           </div>
           <h1 className="mt-2 text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-tight sm:leading-none truncate text-foreground">{trip.destination ?? trip.name}</h1>
           <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-muted">
              <span className="flex items-center gap-2 whitespace-nowrap"><Calendar size={14} className="text-foreground" /> {trip.startDate} — {trip.endDate}</span>
              <div className="hidden h-4 w-px bg-border lg:block" />
              <span className="flex items-center gap-2 whitespace-nowrap"><MapPin size={14} className="text-foreground" /> {trip.destinationCountry}</span>
              <div className="hidden h-4 w-px bg-border lg:block" />
              <span className="flex items-center gap-2 whitespace-nowrap"><Sparkles size={14} className="text-foreground" /> {selectedPlaces.length} Saved</span>
              <div className="hidden h-4 w-px bg-border lg:block" />
              <span className="flex items-center gap-2 whitespace-nowrap"><Plane size={14} className="text-foreground" /> {dbTrip?.bookings.length ?? 0} Logistics</span>
              <div className="hidden h-4 w-px bg-border lg:block" />
              <span className="text-foreground flex items-center gap-2 whitespace-nowrap"><CreditCard size={14} className="text-foreground" /> {formatCurrency(trip.budget)} Pool</span>
           </div>
        </div>
        
        <Link href={nextStep.href} className="w-full lg:w-auto">
          <button className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-foreground px-8 text-xs font-bold uppercase tracking-[0.2em] text-background shadow-2xl hover:translate-y-[-2px] transition-all lg:w-auto lg:h-14">
            Continue Planning <ArrowRight size={14} />
          </button>
        </Link>
      </header>

      {/* Trip Flow Progress Strip */}
      <div className="mb-6 flex shrink-0 items-center gap-4 overflow-x-auto rounded-xl border border-border bg-surface p-4 shadow-sm scrollbar-hide no-scrollbar lg:mb-8">
        {steps.map((step, i) => (
          <div key={step.label} className="flex shrink-0 items-center last:flex-none">
            <Link href={step.href} className="group flex flex-col items-center gap-2 min-w-[70px]">
              <div className={`flex size-8 items-center justify-center rounded-full border-2 transition-all ${
                step.status === "done" ? "bg-foreground border-foreground text-background" :
                step.status === "current" ? "border-foreground bg-background text-foreground animate-pulse shadow-[0_0_12px_rgba(0,0,0,0.1)]" :
                "border-border bg-background text-muted"
              }`}>
                {step.status === "done" ? <CheckCircle2 size={16} /> : 
                 step.status === "current" ? <Clock size={16} /> : 
                 <span className="text-[10px] font-black">{i + 1}</span>}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${
                step.status === "done" ? "text-foreground" :
                step.status === "current" ? "text-foreground" :
                "text-muted"
              }`}>{step.label}</span>
            </Link>
            {i < steps.length - 1 && (
              <div className={`mx-4 h-px w-8 sm:w-12 lg:w-16 xl:w-24 ${step.status === "done" ? "bg-foreground" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* 2. High-Density Grid */}
      <main className="flex-1 min-h-0">
        <div className="flex h-full flex-col gap-6 lg:grid lg:grid-cols-12 lg:grid-rows-6">
          
          {/* Main Visual - The Destination */}
          <section className="relative min-h-[300px] overflow-hidden rounded-2xl border border-border shadow-sm lg:col-span-7 lg:row-span-4 lg:min-h-0">
             <Image 
               src={imageForDestination(trip.destination, trip.destinationCountry, 1200, 800)} 
               alt={trip.destination || "Destination"} 
               fill 
               className="object-cover grayscale-[0.2] brightness-[0.8]" 
               priority
               unoptimized
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
             <div className="absolute bottom-6 left-6 lg:bottom-10 lg:left-10 text-white">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Live Environment Telemetry</p>
                <div className="mt-3 flex items-center gap-6">
                   <span className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter">{weather.temperatureRange}</span>
                   <div className="text-[10px] sm:text-xs font-bold leading-tight uppercase tracking-widest">
                      <p>{weather.summary}</p>
                      <p className="mt-1 opacity-60">{weather.rainRisk} Precipitation risk</p>
                   </div>
                </div>
             </div>
          </section>

          {/* Daily Digest - High Density List */}
          <section className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface lg:col-span-5 lg:row-span-3">
             <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-background px-5">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Planned Timeline</span>
                <Link href="/itinerary" className="text-[10px] font-bold text-muted hover:text-foreground uppercase">Inspect All</Link>
             </div>
             <div className="max-h-[300px] flex-1 overflow-y-auto divide-y divide-border/40 lg:max-h-none scrollbar-hide">
                {days.slice(0, 8).map((day, i) => (
                  <div key={day.id} className="group flex items-center gap-4 p-4 hover:bg-background transition-colors cursor-default">
                     <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-background border border-border text-[10px] font-black text-foreground">
                        {i < 9 ? `0${i + 1}` : i + 1}
                     </span>
                     <div className="min-w-0 flex-1">
                        <h4 className="truncate text-xs font-bold uppercase tracking-tight text-foreground">{day.theme}</h4>
                        <p className="mt-1 truncate text-[10px] text-muted leading-relaxed font-medium uppercase">{day.morningPlan}</p>
                     </div>
                     <ChevronRight size={12} className="text-muted group-hover:text-foreground transition-colors" />
                  </div>
                ))}
                {days.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center opacity-40">
                     <p className="text-[10px] font-black uppercase tracking-widest">Timeline Empty</p>
                  </div>
                )}
             </div>
          </section>

          {/* Needs Attention Panel */}
          <section className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-2 lg:col-span-5 lg:row-span-1">
             <div className="flex h-8 shrink-0 items-center border-b border-border bg-background/50 px-4">
                <span className="text-[8px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                   <AlertCircle size={10} className="text-foreground" />
                   Health Check / Attention Required
                </span>
             </div>
             <div className="flex-1 p-3 flex gap-2 overflow-x-auto no-scrollbar scrollbar-hide lg:overflow-x-hidden lg:grid lg:grid-cols-2">
                {warnings.length > 0 ? warnings.map((warning) => (
                  <div key={warning.id} className="flex h-full min-w-[140px] items-center gap-2 rounded-lg border border-border bg-background p-2 shadow-sm lg:min-w-0">
                     <AlertCircle size={12} className="text-rose-600 shrink-0" />
                     <div className="min-w-0">
                        <p className="truncate text-[9px] font-bold uppercase tracking-tight text-foreground">{warning.label}</p>
                        {warning.href && (
                          <Link href={warning.href} className="text-[8px] font-black text-muted hover:text-foreground uppercase underline underline-offset-2">Action</Link>
                        )}
                     </div>
                  </div>
                )) : (
                  <div className="flex w-full items-center justify-center gap-2 text-muted lg:col-span-2">
                     <CheckCircle2 size={12} className="text-emerald-600" />
                     <span className="text-[9px] font-black uppercase tracking-widest">System Nominal</span>
                  </div>
                )}
             </div>
          </section>

          {/* Budget Snapshot */}
          <section className="flex flex-col justify-between rounded-2xl border border-border bg-background p-6 shadow-sm lg:col-span-3 lg:row-span-2 lg:p-6">
             <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">Capital Utilization</span>
                <div className="mt-4 flex items-baseline gap-2">
                   <span className="text-3xl font-black tracking-tight text-foreground">{formatCurrency(actual)}</span>
                   <span className="text-[10px] font-bold text-muted uppercase">Actual</span>
                </div>
             </div>
             <div className="mt-6 space-y-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2 border border-border">
                   <div className="h-full bg-foreground transition-all duration-1000" style={{ width: `${Math.min(100, (actual / (trip.budget || 1)) * 100)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted">
                   <span>Remaining</span>
                   <span className="text-foreground">{formatCurrency(remaining)}</span>
                </div>
             </div>
          </section>

          {/* Curated Selection Gallery */}
          <section className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface lg:col-span-9 lg:row-span-2">
             <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-background px-5">
                <span className="text-[10px] font-black uppercase tracking-widest">Discovery Selection</span>
                <Link href="/discover" className="text-[10px] font-bold text-muted hover:text-foreground uppercase">Manage Stack</Link>

             </div>
             <div className="flex min-h-[120px] flex-1 gap-px bg-border/40 lg:min-h-0">
                {selectedPlaces.slice(0, 6).map((place) => (
                  <div key={place.id} className="relative flex-1 group overflow-hidden bg-background first:rounded-bl-xl last:rounded-br-xl">
                     <Image 
                       src={imageForPlace(place)} 
                       alt={place.name} 
                       fill
                       className="object-cover grayscale brightness-[0.7] group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700" 
                       unoptimized
                     />
                     <div className="absolute inset-0 flex flex-col justify-end p-4 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/60 backdrop-blur-[2px]">
                        <h4 className="text-[10px] font-black uppercase truncate tracking-tight">{place.name}</h4>
                        <p className="mt-1 text-[8px] font-bold tracking-[0.1em] opacity-60 uppercase">{place.category}</p>
                     </div>
                  </div>
                ))}
                {selectedPlaces.length === 0 && (
                  <div className="flex-1 flex items-center justify-center p-8 text-center text-muted">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Discovery Stack Empty</p>
                  </div>
                )}
             </div>
          </section>

        </div>
      </main>

      {/* 3. Global Shortcuts Rail */}
      <footer className="mt-6 flex shrink-0 flex-wrap items-center justify-center gap-x-12 gap-y-4 border-t border-border/50 pt-6 pb-2 lg:mt-8 lg:pb-0">
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
       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted group-hover:text-foreground transition-colors">{label}</span>
       <span className="rounded border border-border-strong bg-surface px-1.5 py-0.5 text-[8px] font-black text-muted-2">{keybind}</span>
    </Link>
  );
}

