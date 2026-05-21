"use client";

import { cn } from "@/lib/utils";
import { Loader2, Calendar, ChevronRight } from "lucide-react";
import Image from "next/image";
import type { LiveEvent } from "@/lib/api/eventsService";

type EventsViewProps = {
  isFetchingEvents: boolean;
  liveEvents: LiveEvent[];
  selectedEventId: string;
  onSelectEvent: (id: string) => void;
};

export function EventsView({
  isFetchingEvents,
  liveEvents,
  selectedEventId,
  onSelectEvent,
}: EventsViewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
      <header className="flex items-center justify-between border-b border-border pb-6">
         <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">Temporal Intelligence</span>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-tighter text-foreground">Live Sector Events</h2>
         </div>
         {isFetchingEvents && (
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
             <Loader2 size={12} className="animate-spin" />
             Scanning Sector
           </div>
         )}
      </header>

      <div className="flex flex-col gap-3">
         {liveEvents.map((event) => (
           <button 
              key={event.id}
              onClick={() => onSelectEvent(event.id)}
              className={cn(
                "flex items-center gap-4 rounded-xl border p-3 text-left transition-all hover:bg-surface-2",
                selectedEventId === event.id 
                  ? "bg-surface-2 border-foreground ring-1 ring-foreground" 
                  : "bg-background border-border"
              )}
           >
              <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted relative">
                 {event.thumbnail ? (
                   <Image 
                     src={event.thumbnail} 
                     alt={event.name} 
                     fill 
                     className="object-cover" 
                   />
                 ) : (
                   <div className="grid h-full place-items-center opacity-20"><Calendar size={20} /></div>
                 )}
              </div>
              <div className="min-w-0 flex-1">
                 <h4 className="truncate text-sm font-black uppercase tracking-tight text-foreground">{event.name}</h4>
                 <div className="mt-1 flex items-center gap-3">
                   <span className="truncate text-[10px] font-bold text-muted uppercase tracking-widest">{event.date}</span>
                   <span className="text-[10px] font-black text-muted/40">•</span>
                   <span className="truncate text-[9px] font-black text-muted-foreground uppercase">{event.venue}</span>
                 </div>
              </div>
              <ChevronRight size={14} className={cn("shrink-0 transition-transform", selectedEventId === event.id ? "text-foreground translate-x-1" : "text-muted/40")} />
           </button>
         ))}

         {!isFetchingEvents && liveEvents.length === 0 && (
           <div className="col-span-full py-20 text-center opacity-40">
              <Calendar size={48} className="mx-auto mb-4" strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">No tactical events identified for this window</p>
           </div>
         )}
      </div>
    </div>
  );
}
