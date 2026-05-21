"use client";

import { cn } from "@/lib/utils";
import { CloudSun, CloudRain, Wind, ChevronRight } from "lucide-react";
import Image from "next/image";
import { imageForPlace } from "@/lib/travel/media";
import { WeatherIcon } from "../weather-icon";
import type { PlaceRecommendation } from "@/lib/types/travel";

type WeatherViewProps = {
  todayWeather: {
    label: string;
    maxC: number;
    minC: number;
    weatherCode: number;
    rainChance: number;
    windSpeedKmh: number;
  };
  isGoodWeather: boolean;
  filteredPlaces: PlaceRecommendation[];
  onSelectPlace: (id: string) => void;
};

export function WeatherView({
  todayWeather,
  isGoodWeather,
  filteredPlaces,
  onSelectPlace,
}: WeatherViewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
      <header>
         <span className="text-[10px] font-black uppercase tracking-widest text-muted">Meteorological Readiness</span>
         <h2 className="mt-2 text-2xl font-black uppercase tracking-tighter text-foreground">Tactical Weather</h2>
      </header>

      <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
         <div className="rounded-2xl border-2 border-foreground bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-foreground text-background">
                     <WeatherIcon code={todayWeather.weatherCode} size={20} />
                  </div>
                  <div>
                     <p className="text-[9px] font-black uppercase tracking-widest text-muted">Current Sector</p>
                     <p className="text-lg font-black uppercase tracking-tight text-foreground">{todayWeather.label}</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-3xl font-black tracking-tighter text-foreground">{todayWeather.maxC}°</p>
                  <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Low: {todayWeather.minC}°</p>
               </div>
            </div>

            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted">
               <span className="flex items-center gap-1.5 text-foreground"><CloudRain size={12} className="text-foreground" /> {todayWeather.rainChance}% Rain</span>
               <span className="flex items-center gap-1.5 text-foreground"><Wind size={12} className="text-foreground" /> {todayWeather.windSpeedKmh}kmh Wind</span>
            </div>
         </div>

         <section>
            <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Readiness Assessment</h3>
            <div className={cn(
              "rounded-xl border-2 p-5 shadow-sm",
              isGoodWeather ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500" : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-500"
            )}>
               <p className="text-[11px] font-black uppercase tracking-tight leading-relaxed">
                  {isGoodWeather 
                    ? "Optimal conditions for outdoor deployment. Prioritizing parks, viewpoints, and open-air landmarks."
                    : "Sub-optimal weather detected. Prioritizing indoor tactical points: museums, cafes, and shopping sectors."}
               </p>
            </div>
         </section>

         <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Recommended for Today</h3>
            <div className="divide-y divide-border/50">
               {filteredPlaces.slice(0, 10).map((place) => (
                 <button
                    key={place.id}
                    onClick={() => onSelectPlace(place.id)}
                    className="flex w-full items-center gap-3 py-3 text-left hover:bg-surface transition-colors group"
                 >
                    <div className="size-8 shrink-0 overflow-hidden rounded-md bg-muted grayscale-[0.5] group-hover:grayscale-0 transition-all">
                       <Image 
                         src={imageForPlace(place)} 
                         alt={place.name} 
                         width={32} 
                         height={32} 
                         className="h-full w-full object-cover" 
                         unoptimized
                       />
                    </div>
                    <div className="min-w-0 flex-1">
                       <h4 className="truncate text-xs font-bold uppercase tracking-tight leading-none mb-1">{place.name}</h4>
                       <p className="truncate text-[9px] font-black uppercase tracking-widest text-muted">{place.category}</p>
                    </div>
                    <ChevronRight size={12} className="text-muted opacity-0 group-hover:opacity-100 transition-all" />
                 </button>
               ))}
            </div>
         </section>
      </div>
    </div>
  );
}
