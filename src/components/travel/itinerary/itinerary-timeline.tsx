"use client";

import { type MouseEventHandler } from "react";
import {
  Trash2,
  ShieldCheck,
  CalendarDays,
  Download,
  Printer,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ItineraryDay, TripDraft } from "@/lib/types/travel";
import type { WeatherSummary } from "@/lib/api/weatherService";
import type { ItineraryWeatherImpact } from "@/lib/travel/weather-intelligence";
import { WeatherIcon } from "../weather-icon";
import { formatShortDate } from "./itinerary-utils";

type ItineraryTimelineProps = {
  trip: TripDraft | null;
  days: ItineraryDay[];
  activeDayId: string;
  generating: boolean;
  busyAction: string;
  weather?: WeatherSummary | null;
  weatherImpact: ItineraryWeatherImpact[];
  onSelectDay: (id: string) => void;
  onDeleteDay: (id: string) => void;
  onGenerate: () => void;
  onClear: () => void;
  onAddDay: () => void;
  onExport: () => void;
  onReopen: () => void;
  onApprove: () => void;
};

export function ItineraryTimeline({
  trip,
  days,
  activeDayId,
  generating,
  busyAction,
  weather,
  weatherImpact,
  onSelectDay,
  onDeleteDay,
  onGenerate,
  onClear,
  onAddDay,
  onExport,
  onReopen,
  onApprove,
}: ItineraryTimelineProps) {
  return (
    <aside className={cn(
      "flex w-full shrink-0 flex-col border-r border-border bg-surface transition-all duration-300 lg:w-[400px]",
      activeDayId ? "h-[180px] lg:h-full" : "h-full"
    )}>
      <div className="flex h-auto min-h-12 shrink-0 flex-col border-b border-border bg-background px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:py-0">
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">TIMELINE</span>
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-muted">
              {days.length}
            </span>
          </div>
        </div>
        <div className="flex flex-nowrap items-center gap-1 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
          {trip?.status === "itinerary_approved" ? (
             <div className="flex items-center gap-1 flex-nowrap">
                <div className="flex h-7 shrink-0 items-center gap-1 rounded-md bg-emerald-50 px-2 text-[8px] font-black uppercase tracking-wider text-emerald-600 ring-1 ring-emerald-200">
                  <ShieldCheck size={10} />
                  <span>Done</span>
                </div>
                <ToolbarButton onClick={onReopen} className="h-7 text-[8px] px-2" title="Unlock for editing">Unlock</ToolbarButton>
             </div>
          ) : (
             <ToolbarButton 
                onClick={onApprove}
                primary 
                disabled={days.length === 0 || generating} 
                className="h-7 text-[8px] px-2"
                title="Commit itinerary"
             >
                Approve
             </ToolbarButton>
          )}

          <ToolbarButton 
             onClick={onGenerate} 
             disabled={generating || trip?.status === "itinerary_approved"} 
             primary={trip?.status !== "itinerary_approved" && days.length === 0} 
             className="h-7 text-[8px] px-2"
             title="Build with AI"
          >
            Build
          </ToolbarButton>
          
          <ToolbarButton
             onClick={onClear}
             disabled={days.length === 0}
             className="h-7 text-[8px] px-2"
             title="Clear"
           >
              Clear
           </ToolbarButton>

          <ToolbarButton onClick={onAddDay} disabled={Boolean(busyAction)} className="h-7 text-[8px] px-2" title="Add Day">
             + Day
          </ToolbarButton>

          <Link href="/trip-pack">
            <ToolbarButton className="h-7 text-[8px] px-2" title="Print"><Printer size={10} /></ToolbarButton>
          </Link>
          
          <ToolbarButton onClick={onExport} className="h-7 text-[8px] px-2" title="JSON"><Download size={10} /></ToolbarButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border/50 bg-background">
        <AnimatePresence initial={false}>
          {days.map((day, idx) => {
            const impact = weatherImpact.find(i => i.date === day.date);
            const dailyWeather = weather?.daily.find(d => d.date === day.date);
            return (
              <motion.div key={day.id} layout transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                <TimelineDayRow 
                  day={day} 
                  idx={idx} 
                  active={activeDayId === day.id}
                  impact={impact}
                  weather={dailyWeather}
                  onClick={() => onSelectDay(day.id)}
                  onDelete={() => onDeleteDay(day.id)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
        {days.length === 0 && !generating && (
          <div className="space-y-3 p-12 text-center">
             <CalendarDays size={32} className="mx-auto mb-4" strokeWidth={1} />
             <p className="text-[10px] font-bold uppercase tracking-widest text-foreground">No itinerary yet</p>
             <p className="text-xs leading-relaxed text-muted">
               Generate from your saved places to create a full trip plan.
             </p>
          </div>
        )}
      </div>
    </aside>
  );
}

function TimelineDayRow({ day, idx, active, onClick, onDelete, impact, weather }: { day: ItineraryDay, idx: number, active: boolean, onClick: () => void, onDelete: () => void, impact?: ItineraryWeatherImpact, weather?: WeatherSummary["daily"][number] }) {
  const riskColor = impact?.risk === "high" ? "bg-rose-500" : impact?.risk === "medium" ? "bg-amber-500" : "bg-emerald-500";
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer border-l-4 py-6 pl-6 transition-all",
        active ? "border-foreground bg-surface-2" : "border-transparent hover:bg-surface"
      )}
    >
      <div className="flex items-center justify-between pr-4">
        <div className="flex items-center gap-2">
           <div className={cn("size-2 rounded-full shadow-sm", riskColor)} title={`${impact?.risk || "low"} weather risk`} />
           <span className="text-[10px] font-black uppercase tracking-widest text-muted">
             DAY 0{idx + 1} <span className="mx-2 opacity-30">/</span> {formatShortDate(day.date)}
           </span>
        </div>
        <div className="flex items-center gap-3">
          {weather && <WeatherIcon code={weather.weatherCode} size={12} className="text-muted group-hover:text-foreground transition-colors" />}
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-rose-600"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      
      <h3 className={cn("mt-2 text-sm font-black uppercase tracking-tight truncate pr-6", active ? "text-foreground" : "text-muted-2")}>
        {day.theme}
      </h3>
    </div>
  );
}

function ToolbarButton({ 
  children, 
  onClick, 
  disabled, 
  primary = false, 
  title, 
  className,
  type = "button"
}: { 
  children: React.ReactNode, 
  onClick?: MouseEventHandler<HTMLButtonElement>, 
  disabled?: boolean, 
  primary?: boolean, 
  title?: string, 
  className?: string,
  type?: "button" | "submit" | "reset"
}) {
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      title={title}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-md px-3 text-[9px] font-black uppercase tracking-wider transition-all",
        primary 
          ? "bg-foreground text-background hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-300 shadow-lg" 
          : "bg-surface-2 text-muted hover:bg-border disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}
