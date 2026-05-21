"use client";

import { 
  Thermometer, 
  CloudRain, 
  Wind, 
  Briefcase, 
  AlertTriangle, 
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Zap,
  Umbrella,
  Shirt,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PrimaryTrip } from "@/lib/db/travel";
import type { WeatherSummary } from "@/lib/api/weatherService";
import type { ItineraryWeatherImpact, PackingSuggestion } from "@/lib/travel/weather-intelligence";
import { getOutdoorSuitability } from "@/lib/travel/weather-intelligence";
import { WeatherIcon } from "./weather-icon";

type WeatherWorkspaceProps = {
  trip: PrimaryTrip;
  weather: WeatherSummary;
  weatherImpact: ItineraryWeatherImpact[];
  packingSuggestions: PackingSuggestion[];
};

export function WeatherWorkspace({ trip, weather, weatherImpact, packingSuggestions }: WeatherWorkspaceProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState("");
  
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  
  const handleMitigateDay = async (date: string) => {
    const impact = weatherImpact.find(i => i.date === date);
    if (!impact) return;
    
    setIsPending(true);
    setStatus(`Mitigating ${impact.theme}...`);
    
    const instruction = `URGENT: High weather risk detected for ${date}. 
    Regenerate this day to be 100% INDOOR focused. Replace outdoor viewpoints or walking tours 
    with museums, indoor galleries, or shopping.`;

    const response = await fetch("/api/ai/adjust-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, instruction, save: true }),
    });

    setIsPending(false);
    if (response.ok) {
       router.refresh();
       setStatus("Itinerary optimized for weather.");
       setTimeout(() => setStatus(""), 3000);
    }
  };

  const today = weather.daily[0];
  const outfit = getOutfitRecommendation(today?.maxC || 20, today?.rainChance || 0);

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto lg:overflow-hidden bg-background scrollbar-hide">
      
      {/* 1. Tactical Header */}
      <header className="flex h-auto shrink-0 flex-col gap-6 border-b border-border bg-surface px-6 py-6 sm:h-20 sm:flex-row sm:items-center sm:justify-between sm:py-0">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
           <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black tracking-widest text-muted uppercase">Meteorology Sync</span>
              <span className="text-xl font-bold tracking-tight">{trip.destination || "Target Destination"}</span>
           </div>
           <div className="hidden h-8 w-px bg-border/50 sm:block" />
           <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-muted">
              <div className="flex items-center gap-2">
                 <Calendar size={14} className="text-foreground" />
                 <span>{startDate.toLocaleDateString()} — {endDate.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                 <Thermometer size={14} className="text-foreground" />
                 <span>{weather.temperatureRange}</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-2">
           <span className="flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-[10px] font-bold uppercase tracking-widest text-muted">
              Source: {weather.source.provider.toUpperCase()}
           </span>
        </div>
      </header>

      {/* 2. Dashboard Grid */}
      <main className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Stage: Forecast Telemetry */}
        <section className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-12 space-y-12 scrollbar-hide border-r border-border">
           
           {status && (
             <div className="animate-in fade-in slide-in-from-top-2 rounded-xl bg-foreground p-4 text-background text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} className="text-emerald-400" />}
                {status}
             </div>
           )}

           {/* Current Sector Summary */}
           {today && (
             <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-3xl border-2 border-foreground bg-background p-8 shadow-2xl space-y-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-5">
                      <WeatherIcon code={today.weatherCode} size={160} />
                   </div>
                   <div className="relative z-10 flex items-center justify-between">
                      <div className="space-y-1">
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Current Sector</p>
                         <p className="text-4xl font-black tracking-tighter uppercase text-foreground">{today.label}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-5xl font-black tracking-tighter leading-none text-foreground">{today.maxC}°</p>
                         <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-2">Low: {today.minC}°</p>
                      </div>
                   </div>

                   <div className="relative z-10 flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-muted">
                      <span className="flex items-center gap-2 text-foreground"><CloudRain size={14} className="text-foreground" /> {today.rainChance}% Rain</span>
                      <span className="flex items-center gap-2 text-foreground"><Wind size={14} className="text-foreground" /> {today.windSpeedKmh}kmh Wind</span>
                   </div>
                </div>

                <div className="rounded-3xl border border-border bg-surface p-8 space-y-8">
                   <div className="flex items-center gap-3">
                      <Shirt size={18} className="text-foreground" />
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Tactical Gear</h3>
                   </div>
                   
                   <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border">
                         <div className="grid size-10 place-items-center rounded-xl bg-surface-2 text-black">
                            <Umbrella size={20} />
                         </div>
                         <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">Primary Layer</p>
                            <p className="text-xs font-black uppercase tracking-tight">{outfit.layer}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border">
                         <div className="grid size-10 place-items-center rounded-xl bg-surface-2 text-black">
                            <Briefcase size={20} />
                         </div>
                         <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">Tactical Add-on</p>
                            <p className="text-xs font-black uppercase tracking-tight">{outfit.extra}</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {/* Hourly Forecast */}
           {weather.hourly && (
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">24-Hour Telemetry</h3>
                   <span className="text-[9px] font-bold text-muted uppercase">Next 24h</span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scrollbar-hide">
                   {weather.hourly.map((h, i) => (
                     <div key={i} className="flex flex-col items-center gap-4 min-w-[72px] p-4 rounded-2xl border border-border bg-surface hover:border-black transition-all">
                        <span className="text-[9px] font-black uppercase tracking-tighter text-muted">
                           {new Date(h.time).getHours()}:00
                        </span>
                        <WeatherIcon code={h.weatherCode} size={18} className="text-foreground" />
                        <span className="text-sm font-black tracking-tighter">{h.tempC}°</span>
                        <div className="flex items-center gap-0.5 text-[8px] font-bold text-muted">
                           <CloudRain size={8} /> {h.rainChance}%
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {/* Daily Tactical View */}
           <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">14-Day Tactical Projection</h3>
                 <span className="text-[9px] font-bold text-muted uppercase">Full Deployment Window</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar scrollbar-hide">
                 {weather.daily.map((day) => {
                    const dateStr = day.date;
                    const tripStart = new Date(trip.startDate);
                    const currentDate = new Date(dateStr);
                    // Ensure we compare dates properly by stripping time
                    tripStart.setHours(12, 0, 0, 0);
                    currentDate.setHours(12, 0, 0, 0);
                    
                    const diffTime = currentDate.getTime() - tripStart.getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    
                    // Correctly determine if this forecast day falls within the itinerary range
                    const dayLabel = (diffDays >= 0 && diffDays < 100) // Fallback limit to prevent infinite loops or errors
                      ? `Day ${String(diffDays + 1).padStart(2, '0')}` 
                      : undefined;

                    return <ForecastCard key={day.date} day={day} itineraryDayLabel={dayLabel} />;
                 })}
              </div>
           </div>

           {/* Itinerary Intelligence */}
           {weatherImpact.length > 0 && (
             <div className="space-y-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Operational Impact</h3>
                <div className="space-y-4">
                   {weatherImpact.map((impact) => (
                     <ImpactRow 
                        key={impact.date} 
                        impact={impact} 
                        onMitigate={() => handleMitigateDay(impact.date)}
                        isPending={isPending}
                     />
                   ))}
                </div>
             </div>
           )}
        </section>

        {/* Right Stage: Deployment Logistics */}
        <aside className="w-full lg:w-[400px] shrink-0 overflow-y-auto bg-surface p-6 lg:p-10 space-y-12 scrollbar-hide pb-24">
           
           <section>
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">Inventory Prep</h3>
                 <Briefcase size={14} className="text-muted" />
              </div>
              
              <div className="space-y-4">
                 {packingSuggestions.map((s, idx) => (
                   <div key={idx} className="p-5 rounded-2xl border border-border bg-background shadow-sm group hover:border-black transition-all">
                      <div className="flex items-center gap-3 mb-2">
                         <div className="size-1.5 rounded-full bg-foreground" />
                         <p className="text-[11px] font-black uppercase tracking-tight text-foreground">{s.item}</p>
                      </div>
                      <p className="mt-2 text-[10px] font-bold text-muted uppercase tracking-widest leading-relaxed ml-4.5">{s.reason}</p>
                   </div>
                 ))}
              </div>
           </section>

           <section className="rounded-3xl border-2 border-border bg-surface-2 p-8 shadow-inner space-y-6">
              <div className="flex items-center gap-4">
                 <div className="grid size-10 place-items-center rounded-xl bg-foreground text-background shadow-lg">
                    <CheckCircle2 size={20} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Window of Op</p>
                    <p className="text-lg font-black uppercase tracking-tight">Prime Window</p>
                 </div>
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-foreground">
                 Best time for outdoor deployment: <span className="text-emerald-600">09:00 — 14:00</span>
              </p>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-relaxed">
                 Suitability index is computed by cross-referencing your scheduled places against precipitation and thermal thresholds.
              </p>
           </section>

        </aside>
      </main>

      <footer className="flex h-10 shrink-0 items-center justify-between border-t border-border bg-surface px-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted z-30">
         <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><ShieldCheck size={12} className="text-emerald-500" /> SECTOR AUDIT ACTIVE</span>
            <span className="flex items-center gap-2 font-bold text-foreground uppercase tracking-wider">{trip.destination} WEATHER SYNCED</span>
         </div>
      </footer>
    </div>
  );
}

function getOutfitRecommendation(temp: number, rain: number) {
  if (rain > 40) return { layer: "Waterproof Shell", extra: "Full-size Umbrella" };
  if (temp < 10) return { layer: "Heavy Insulation", extra: "Thermal Base" };
  if (temp < 18) return { layer: "Light Jacket", extra: "Comfortable Scarf" };
  if (temp > 28) return { layer: "Breathable Mesh", extra: "UV Protection" };
  return { layer: "Casual Standard", extra: "Light Sunglasses" };
}

function ForecastCard({ day, itineraryDayLabel }: { day: WeatherSummary["daily"][number], itineraryDayLabel?: string }) {
  const suitability = getOutdoorSuitability(day);
  
  return (
    <div className="min-w-[90px] rounded-2xl border border-border bg-background p-4 shadow-sm flex flex-col items-center gap-3 transition-all hover:border-black hover:shadow-lg active:scale-95 group relative overflow-hidden">
       {suitability !== "Good" && (
         <div className={cn(
           "absolute top-0 right-0 size-2 rounded-bl-lg",
           suitability === "Caution" ? "bg-amber-400" : "bg-rose-500"
         )} />
       )}
       
       <div className="text-center space-y-0.5">
          <p className="text-[10px] font-black uppercase tracking-tight text-foreground">
             {itineraryDayLabel || new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
          </p>
          <p className="text-[8px] font-bold text-muted uppercase tracking-widest">
             {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
       </div>

       <div className="grid size-12 place-items-center rounded-xl bg-surface-2 group-hover:bg-foreground group-hover:text-background transition-colors">
          <WeatherIcon code={day.weatherCode} size={24} />
       </div>

       <div className="text-center">
          <p className="text-lg font-black tracking-tighter leading-none">{day.maxC}°</p>
          <p className="text-[9px] font-bold text-muted uppercase mt-1">L {day.minC}°</p>
       </div>

       <div className="flex items-center gap-1 text-[9px] font-black text-muted-2">
          <CloudRain size={10} /> {day.rainChance}%
       </div>
    </div>
  );
}

function ImpactRow({ 
  impact, 
  onMitigate, 
  isPending 
}: { 
  impact: ItineraryWeatherImpact, 
  onMitigate: () => void,
  isPending: boolean
}) {
  const statusColor = impact.risk === "high" ? "text-rose-600" : impact.risk === "medium" ? "text-amber-600" : "text-emerald-600";
  const StatusIcon = impact.risk === "high" ? AlertTriangle : impact.risk === "medium" ? Info : CheckCircle2;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 rounded-2xl border-2 border-border bg-surface/50 hover:border-black transition-all duration-300 hover:shadow-xl group">
       <div className="sm:w-32 shrink-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted">{new Date(impact.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">{new Date(impact.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
       </div>

       <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
             <h4 className="text-xs font-black uppercase tracking-tight truncate">{impact.theme}</h4>
             {impact.isOutdoorHeavy && (
               <span className="flex items-center gap-1 rounded bg-foreground/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter text-muted">
                  Outdoor Heavy
               </span>
             )}
          </div>
          {impact.warnings.length > 0 ? (
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-tight truncate">
               {impact.warnings.join(" • ")}
            </p>
          ) : (
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">Telemetry clear</p>
          )}
       </div>

       <div className="flex items-center gap-4">
          <div className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shrink-0", statusColor)}>
             <StatusIcon size={16} />
             {impact.risk} risk
          </div>
          
          {impact.risk !== "low" && (
            <button 
               onClick={onMitigate}
               disabled={isPending}
               className="h-8 px-4 rounded-lg bg-foreground text-background text-[9px] font-black uppercase tracking-widest shadow-lg opacity-0 group-hover:opacity-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
               {isPending ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
               Mitigate
            </button>
          )}
       </div>
    </div>
  );
}


