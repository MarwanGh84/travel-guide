"use client";

import { useState, useEffect } from "react";
import { 
  Bookmark, 
  Train, 
  CloudSun, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  Trash2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ItineraryDay } from "@/lib/types/travel";

export function AIBuildModal() {
  const steps = [
    { id: 1, text: "Checking saved places", icon: Bookmark },
    { id: 2, text: "Balancing travel time", icon: Train },
    { id: 3, text: "Reviewing weather telemetry", icon: CloudSun },
    { id: 4, text: "Optimizing daily flow", icon: Sparkles },
    { id: 5, text: "Finalizing itinerary", icon: CheckCircle2 }
  ];
  
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(s => (s < steps.length - 1 ? s + 1 : s));
    }, 2500);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 backdrop-blur-md transition-all duration-500 animate-in fade-in">
       <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-foreground/10 bg-background p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center space-y-8">

          <div className="relative mx-auto size-24">
             <div className="absolute inset-0 rounded-full border-4 border-white/5" />
             <motion.div 
                className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
             />
             <div className="absolute inset-0 grid place-items-center text-emerald-500">
                <AnimatePresence mode="wait">
                  <motion.div
                     key={currentStep}
                     initial={{ scale: 0.5, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 1.5, opacity: 0 }}
                  >
                     {(() => {
                       const Icon = steps[currentStep].icon;
                       return <Icon size={32} strokeWidth={1.5} />;
                     })()}
                  </motion.div>
                </AnimatePresence>
             </div>
          </div>

          <div className="space-y-2">
             <h3 className="text-lg font-black uppercase tracking-widest text-foreground">Tactical Architect</h3>
             <div className="h-4">
                <AnimatePresence mode="wait">
                  <motion.p 
                     key={currentStep}
                     initial={{ y: 10, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     exit={{ y: -10, opacity: 0 }}
                     className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400"
                  >
                     {steps[currentStep].text}
                  </motion.p>
                </AnimatePresence>
             </div>
          </div>

          <div className="flex justify-center gap-1.5">
             {steps.map((_, i) => (
               <div 
                  key={i} 
                  className={cn(
                    "h-1 w-8 rounded-full transition-all duration-500",
                    i <= currentStep ? "bg-emerald-500" : "bg-white/10"
                  )} 
               />
             ))}
          </div>

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 animate-pulse">Neural engine engaged</p>
       </div>
    </div>
  );
}

export function ManualShuffleDialog({ days, activeDayId, onCancel, onConfirm }: { 
  days: ItineraryDay[], 
  activeDayId: string, 
  onCancel: () => void, 
  onConfirm: (id: string) => void 
}) {
  const currentDay = days.find(d => d.id === activeDayId);
  
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl space-y-6">
        <div>
           <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Day Optimizer</h2>
           <p className="mt-1 text-[10px] font-bold text-muted uppercase tracking-tight">Swap contents of <span className="text-foreground font-black">{currentDay?.theme}</span> with another day.</p>
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-2 no-scrollbar">
           {days.filter(d => d.id !== activeDayId).map((day, idx) => (
             <button 
               key={day.id}
               onClick={() => onConfirm(day.id)}
               className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:border-foreground hover:bg-surface transition-all group text-left"
             >
                <div className="min-w-0 flex-1">
                   <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-1">Day 0{idx + 1} / {day.date}</p>
                   <p className="text-xs font-black uppercase tracking-tight text-foreground truncate">{day.theme}</p>
                </div>
                <RefreshCw size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-all" />
             </button>
           ))}
        </div>

        <button 
          onClick={onCancel}
          className="w-full h-10 rounded-lg border border-border bg-surface text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-all"
        >
           Cancel
        </button>
      </div>
    </div>
  );
}

export function ClearItineraryDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="clear-itinerary-title">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-md border border-rose-200 bg-rose-50 text-rose-600">
            <Trash2 size={16} />
          </div>
          <div className="min-w-0">
            <h2 id="clear-itinerary-title" className="text-sm font-bold text-foreground">
              Clear entire timeline?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-2">
              All days and scheduled activities will be permanently removed. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-border bg-background h-10 text-[10px] font-black uppercase tracking-widest text-muted transition-colors hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-rose-600 h-10 text-[10px] font-black uppercase tracking-widest text-background transition-colors hover:bg-rose-700"
          >
            Clear timeline
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteDayDialog({
  busy,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="delete-day-title">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-md border border-rose-200 bg-rose-50 text-rose-600">
            <Trash2 size={16} />
          </div>
          <div className="min-w-0">
            <h2 id="delete-day-title" className="text-sm font-bold text-foreground">
              Delete day?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-2">
              This day and all its scheduled activities will be removed from your itinerary.
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-border bg-background h-10 text-[10px] font-black uppercase tracking-widest text-muted transition-colors hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-lg bg-rose-600 h-10 text-[10px] font-black uppercase tracking-widest text-background transition-colors hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            Delete day
          </button>
        </div>
      </div>
    </div>
  );
}
