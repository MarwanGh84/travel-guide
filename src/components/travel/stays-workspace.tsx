"use client";

import { useState } from "react";
import { 
  Bed, 
  Search, 
  ChevronRight, 
  Info, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Star,
  DollarSign,
  MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";
import type { StayZoneRecommendation, HotelSearchSuggestion } from "@/lib/types/stays";

type StaysWorkspaceProps = {
  strategy: string;
  zones: StayZoneRecommendation[];
  searchSuggestions: HotelSearchSuggestion[];
  destination: string;
};

export function StaysWorkspace({ strategy, zones, searchSuggestions, destination }: StaysWorkspaceProps) {
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id ?? "");

  const activeZone = zones.find(z => z.id === selectedZoneId) ?? zones[0];

  return (
    <div className="flex h-full w-full overflow-hidden flex-col lg:flex-row bg-background">
      {/* 1. Sidebar - Zone Selection */}
      <aside className="flex w-full shrink-0 flex-col border-b border-border bg-surface p-6 lg:w-[350px] lg:border-b-0 lg:border-r">
        <div className="flex flex-col h-full gap-8 overflow-y-auto pr-1 scrollbar-hide">
          <section>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Tactical Plan</span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Stay Strategy</h1>
            <p className="mt-4 text-xs font-bold leading-relaxed text-muted uppercase tracking-wide">
              {strategy}
            </p>
          </section>

          <div className="h-px bg-border/60" />

          <section className="space-y-4">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Recommended Zones</span>
                <span className="text-[9px] font-bold text-muted uppercase">{zones.length} AREAS</span>
             </div>
             <div className="space-y-2">
                {zones.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-all group",
                      selectedZoneId === zone.id ? "bg-background border-black shadow-md ring-1 ring-black/5" : "bg-background/50 border-border/60 hover:border-black"
                    )}
                  >
                     <div className="flex items-center justify-between gap-4">
                        <h4 className={cn("truncate text-sm font-black uppercase tracking-tight", selectedZoneId === zone.id ? "text-foreground" : "text-muted-2")}>
                           {zone.areaName}
                        </h4>
                        <ChevronRight size={14} className={cn("shrink-0 transition-transform", selectedZoneId === zone.id ? "text-black translate-x-1" : "text-muted")} />
                     </div>
                     <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-widest text-muted">{zone.confidenceScore * 100}% ITINERARY MATCH</p>
                  </button>
                ))}
             </div>
          </section>

          <section className="mt-auto hidden lg:block rounded-xl bg-black p-5 text-white shadow-2xl">
             <ShieldCheck size={20} className="text-emerald-500 opacity-80" />
             <p className="mt-4 text-[10px] font-black uppercase tracking-widest leading-relaxed opacity-80">
                These zones were calculated by clustering your approved itinerary POIs to reduce travel overhead.
             </p>
          </section>
        </div>
      </aside>

      {/* 2. Main Detail & Inventory Stage */}
      <main className="flex-1 overflow-y-auto bg-background p-8 lg:p-16 xl:p-24 scrollbar-hide">
        <AnimatePresence mode="wait">
          {activeZone ? (
            <motion.div
              key={activeZone.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-4xl"
            >
               <header className="mb-12 border-b border-border pb-12">
                  <div className="flex items-center gap-4 mb-4">
                     <span className="rounded-full bg-surface-2 px-3 py-1 text-[9px] font-black uppercase tracking-widest border border-border">
                        {activeZone.budgetFit} Range
                     </span>
                     <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{activeZone.destination} SECTOR</span>
                  </div>
                  <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter text-foreground leading-none">{activeZone.areaName}</h2>
                  <p className="mt-6 text-xl font-medium leading-relaxed text-muted-2 italic">&quot;{activeZone.reason}&quot;</p>
                  
                  <div className="mt-8 flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-muted">
                     <span className="flex items-center gap-2"><MapPin size={12} /> {activeZone.averageDistanceKm}km average distance</span>
                     <div className="h-3 w-px bg-border" />
                     <span className="flex items-center gap-2"><Star size={12} className="text-amber-500" /> Top {activeZone.hotels.length} verified stays</span>
                  </div>
               </header>

               {/* Hotel Inventory Grid */}
               <section className="mb-20">
                  <h3 className="mb-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Live Inventory</h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                     {activeZone.hotels.map((hotel, i) => (
                       <article key={i} className="group rounded-2xl border border-border bg-surface overflow-hidden hover:border-black transition-all shadow-sm hover:shadow-xl">
                          <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
                             {hotel.photoUrl ? (
                               <img src={hotel.photoUrl} alt={hotel.name} className="h-full w-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105" />
                             ) : (
                               <div className="h-full w-full flex items-center justify-center text-muted opacity-20">
                                  <Bed size={48} strokeWidth={1} />
                               </div>
                             )}
                          </div>
                          <div className="p-5">
                             <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                   <h4 className="truncate text-sm font-black uppercase tracking-tight text-foreground">{hotel.name}</h4>
                                   <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted">{hotel.area}</p>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-black text-foreground">
                                   <Star size={10} fill="currentColor" className="text-amber-500" />
                                   {hotel.rating}
                                </div>
                             </div>
                             
                             <div className="mt-4 flex items-baseline gap-2">
                                <span className="text-2xl font-black tracking-tight">{formatCurrency(hotel.estimatedPricePerNight)}</span>
                                <span className="text-[10px] font-bold uppercase text-muted tracking-widest">/ night</span>
                             </div>

                             <div className="mt-4 flex flex-wrap gap-1.5">
                                {hotel.amenities.map((amenity, idx) => (
                                  <span key={idx} className="rounded border border-border bg-background px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-muted">
                                     {amenity}
                                  </span>
                                ))}
                             </div>

                             <div className="mt-6 flex gap-2">
                                <button 
                                   onClick={() => window.open(hotel.bookingLink, "_blank")}
                                   className="flex-1 h-10 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg hover:bg-zinc-800 transition-all"
                                >
                                   Review Stays
                                </button>
                             </div>
                          </div>
                       </article>
                     ))}
                  </div>
               </section>

               <div className="space-y-16">
                  {/* Intel Grid */}
                  <div className="grid gap-12 sm:grid-cols-2">
                     <section>
                        <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Tactical Advantages</h3>
                        <div className="space-y-3">
                           {activeZone.pros.map((pro, i) => (
                             <div key={i} className="flex items-center gap-3">
                                <Zap size={12} className="text-emerald-500" />
                                <span className="text-xs font-bold uppercase tracking-tight text-foreground">{pro}</span>
                             </div>
                           ))}
                        </div>
                     </section>
                     <section>
                        <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Nearby Clusters</h3>
                        <div className="flex flex-wrap gap-2">
                           {activeZone.nearbyPlaces.map((place, i) => (
                             <span key={i} className="rounded-md border border-border bg-surface px-3 py-1 text-[10px] font-bold uppercase tracking-tight">{place}</span>
                           ))}
                        </div>
                     </section>
                  </div>

                  <section>
                     <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Search Intelligence</h3>
                     <div className="grid gap-4 sm:grid-cols-2">
                        {searchSuggestions.filter(s => s.area === activeZone.areaName || s.area === destination).map((suggestion, i) => (
                          <button 
                            key={i}
                            onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(suggestion.query)}`, "_blank")}
                            className="flex items-center justify-between rounded-xl border border-border bg-surface p-5 text-left hover:border-black transition-all group"
                          >
                             <div className="flex items-center gap-4">
                                <div className="size-10 grid place-items-center rounded-lg bg-background border border-border text-muted group-hover:text-black shadow-inner">
                                   <Search size={16} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-tight">{suggestion.label}</span>
                             </div>
                             <ExternalLink size={14} className="text-muted group-hover:text-black" />
                          </button>
                        ))}
                     </div>
                  </section>
               </div>
            </motion.div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
               <Bed size={64} strokeWidth={1} />
               <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em]">Select a stay zone to review strategy</p>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
