"use client";

import { cn } from "@/lib/utils";
import { Loader2, Calendar, ChevronRight, ExternalLink } from "lucide-react";
import Image from "next/image";
import type { LiveEvent } from "@/lib/api/eventsService";

type EventsViewProps = {
  isFetchingEvents: boolean;
  liveEvents: LiveEvent[];
  selectedEventId: string;
  onSelectEvent: (id: string) => void;
  destination?: string;
};

function eventFallbackLinks(destination: string) {
  const q = encodeURIComponent(destination);
  return [
    { label: "Eventbrite", href: `https://www.eventbrite.com/d/online/${q}/` },
    { label: "Meetup", href: `https://www.meetup.com/find/?keywords=${q}` },
    { label: "Resident Advisor", href: `https://ra.co/events?q=${q}` },
    { label: "Google Events", href: `https://www.google.com/search?q=events+in+${q}` },
  ];
}

export function EventsView({
  isFetchingEvents,
  liveEvents,
  selectedEventId,
  onSelectEvent,
  destination = "",
}: EventsViewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
      <header className="flex items-center justify-between border-b border-border pb-6">
         <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">What&apos;s On</span>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-tighter text-foreground">Live Events</h2>
         </div>
         {isFetchingEvents && (
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
             <Loader2 size={12} className="animate-spin" />
             Searching
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
           <div className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center gap-2 text-muted mb-3">
                 <Calendar size={16} />
                 <span className="text-[11px] font-black uppercase tracking-widest">No live events here yet</span>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                 Live event data needs an <span className="font-mono text-foreground">AERODATABOX_API_KEY</span>. In the meantime,
                 browse what&apos;s on{destination ? ` in ${destination}` : ""} on these sites:
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                 {eventFallbackLinks(destination || "your destination").map((link) => (
                   <a
                     key={link.label}
                     href={link.href}
                     target="_blank"
                     rel="noreferrer"
                     className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground hover:border-foreground transition-colors"
                   >
                     <ExternalLink size={10} /> {link.label}
                   </a>
                 ))}
              </div>
           </div>
         )}
      </div>
    </div>
  );
}
