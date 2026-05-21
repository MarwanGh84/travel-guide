"use client";

import { cn } from "@/lib/utils";
import { Loader2, RefreshCw, Sparkles, type LucideIcon } from "lucide-react";
import { WeatherIcon } from "../weather-icon";

type Category = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type CategoryRailProps = {
  activeCategoryId: string;
  categories: Category[];
  todayWeather?: {
    label: string;
    maxC: number;
    weatherCode: number;
  };
  isPending: boolean;
  onSelectCategory: (id: string) => void;
  onRefreshPlaces: () => void;
  onRefreshAI: () => void;
};

export function CategoryRail({
  activeCategoryId,
  categories,
  todayWeather,
  isPending,
  onSelectCategory,
  onRefreshPlaces,
  onRefreshAI,
}: CategoryRailProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-surface lg:w-[200px] lg:border-b-0 lg:border-r">
      <div className="hidden lg:flex p-4 border-b border-border bg-background items-center justify-between">
         <span className="text-[10px] font-black uppercase tracking-widest text-muted">Field Guide</span>
         {todayWeather && (
           <div className="flex items-center gap-1.5 rounded-full bg-foreground/5 px-2 py-0.5" title={`${todayWeather.label}, ${todayWeather.maxC}°`}>
              <WeatherIcon code={todayWeather.weatherCode} size={10} className="text-foreground" />
              <span className="text-[9px] font-black">{todayWeather.maxC}°</span>
           </div>
         )}
      </div>
      <nav className="flex gap-1 overflow-x-auto p-2 no-scrollbar scrollbar-hide lg:flex-1 lg:flex-col lg:overflow-x-visible">
         {categories.map((cat) => (
           <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={cn(
                "flex items-center gap-3 shrink-0 rounded-md px-3 py-2 text-xs font-bold transition-all lg:w-full border-l-2 lg:py-2.5",
                activeCategoryId === cat.id 
                  ? "bg-surface-2 text-foreground border-foreground shadow-sm" 
                  : "text-muted-foreground border-transparent hover:bg-surface-2/30 hover:border-border"
              )}
           >
              <cat.icon size={14} className={cn(activeCategoryId === cat.id ? "text-foreground" : "text-muted-foreground")} />
              <span className="whitespace-nowrap">{cat.label}</span>
           </button>
         ))}
      </nav>
      <div className="hidden lg:block p-4 space-y-2 border-t border-border">
         <button 
           onClick={onRefreshPlaces}
           disabled={isPending}
           className="flex w-full items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors disabled:opacity-50"
         >
            {isPending ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />} Refresh Places
         </button>
         <button 
           onClick={onRefreshAI}
           disabled={isPending}
           className="flex w-full items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors disabled:opacity-50"
         >
            {isPending ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Get AI Ideas
         </button>
      </div>
    </aside>
  );
}
