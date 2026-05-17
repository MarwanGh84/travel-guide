"use client";

import { useState } from "react";
import { 
  Bed, 
  Search, 
  ChevronRight, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Star,
  MapPin,
  Info
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
      <aside className="flex w-full shrink-0 flex-col border-b border-border bg-surface p-6 lg:w-[350px] lg:border-b-0 lg:border-r shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
        <div className="flex flex-col h-full gap-8 overflow-y-auto pr-1 scrollbar-hide">
          <section>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Tactical Plan</span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground uppercase">Stay Strategy</h1>
            <p className="mt-4 text-[11px] font-bold leading-relaxed text-muted-foreground uppercase tracking-wide">
              {strategy}
            </p>
          </section>

          <div className="h-px bg-border/60" />

          <section className="space-y-4">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Stay Zones</span>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[9px] font-bold text-muted-foreground uppercase">{zones.length} AREAS</span>
             </div>
             <div className="space-y-2">
                {zones.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-all group",
                      selectedZoneId === zone.id 
                        ? "bg-background border-black shadow-md ring-1 ring-black/5" 
                        : "bg-background/50 border-border/60 hover:border-black"
                    )}
                  >
                     <div className="flex items-center justify-between gap-4">
                        <h4 className={cn("truncate text-sm font-black uppercase tracking-tight", selectedZoneId === zone.id ? "text-foreground" : "text-muted-foreground")}>
                           {zone.areaName}
                        </h4>
                        <ChevronRight size={14} className={cn("shrink-0 transition-transform", selectedZoneId === zone.id ? "text-black translate-x-1" : "text-muted-foreground/40")} />
                     </div>
                     <p className="mt-1 truncate text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{zone.confidenceScore * 100}% Itinerary Match</p>
                  </button>
                ))}
             </div>
          </section>

          <section className="mt-auto hidden lg:block rounded-xl bg-black p-5 text-white shadow-2xl">
             <ShieldCheck size={20} className="text-emerald-400 opacity-80 mb-4" />
             <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed opacity-80">
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
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                     <span className="rounded-full bg-surface-2 px-3 py-1 text-[9px] font-black uppercase tracking-widest border border-border text-muted-foreground">
                        {activeZone.budgetFit} Range
                     </span>
                     <span className="rounded-full bg-surface-2 px-3 py-1 text-[9px] font-black uppercase tracking-widest border border-border text-muted-foreground">
                       {activeZone.destination} Sector
                     </span>
                  </div>
                  <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter text-foreground leading-none">{activeZone.areaName}</h2>
                  <p className="mt-8 text-xl font-medium leading-relaxed text-muted-foreground italic tracking-tight">&quot;{activeZone.reason}&quot;</p>
                  
                  <div className="mt-10 flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                     <span className="flex items-center gap-2"><MapPin size={14} className="text-black" /> {typeof activeZone.averageDistanceKm === "number" ? `${activeZone.averageDistanceKm}km Avg distance` : "Distance unavailable"}</span>
                     <div className="h-3 w-px bg-border" />
                     <span className="flex items-center gap-2">
                       <Star size={14} className={cn(activeZone.hotelInventoryStatus === "live" ? "text-amber-500" : "text-muted-foreground/20")} fill={activeZone.hotelInventoryStatus === "live" ? "currentColor" : "none"} />
                       {activeZone.hotelInventoryStatus === "live" ? `${activeZone.hotels.length} Live provider stays` : "No live inventory"}
                     </span>
                  </div>
               </header>

               {/* Hotel Inventory Grid */}
               <section className="mb-24">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Live Accommodation Hub</h3>
                    <div className="flex items-center gap-2">
                       <div className={cn("size-2 rounded-full", activeZone.hotelInventoryStatus === "live" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-muted-foreground/30")} />
                       <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{activeZone.hotelInventoryStatus === "live" ? "System online" : "System standby"}</span>
                    </div>
                  </div>

                  {activeZone.hotelInventoryStatus !== "live" && (
                    <div className="mb-12 rounded-2xl border border-border bg-surface p-8 shadow-sm">
                      <div className="flex items-center gap-3 mb-4 text-muted-foreground">
                        <Info size={18} />
                        <span className="text-[11px] font-black uppercase tracking-widest">Inventory Protocol Note</span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                        {activeZone.hotelInventoryMessage || "Live hotel inventory is currently unavailable for this specific sector or timeframe. We recommend using the search suggestions below to view real-time availability on major platforms."}
                      </p>
                    </div>
                  )}

                  <div className="grid gap-8 sm:grid-cols-2">
                     {activeZone.hotels.map((hotel, i) => (
                       <article key={i} className="group rounded-2xl border border-border bg-surface overflow-hidden hover:border-black transition-all shadow-sm hover:shadow-2xl">
                          <div className="aspect-[16/10] w-full overflow-hidden bg-muted relative">
                             {hotel.photoUrl ? (
                               <img src={hotel.photoUrl} alt={hotel.name} className="h-full w-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />
                             ) : (
                               <div className="h-full w-full flex items-center justify-center text-muted-foreground opacity-20">
                                  <Bed size={48} strokeWidth={1} />
                               </div>
                             )}
                             <div className="absolute top-4 right-4 rounded-full bg-black/80 backdrop-blur-md px-2 py-1 flex items-center gap-1 text-[10px] font-black text-white">
                                <Star size={10} fill="currentColor" className="text-amber-400" />
                                {hotel.rating}
                             </div>
                          </div>
                          <div className="p-6">
                             <div className="min-w-0">
                                <h4 className="truncate text-base font-black uppercase tracking-tight text-foreground leading-none">{hotel.name}</h4>
                                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{hotel.area} · {hotel.source.provider}</p>
                             </div>
                             
                             {typeof hotel.estimatedPricePerNight === "number" && (
                               <div className="mt-6 flex items-baseline gap-2">
                                  <span className="text-3xl font-black tracking-tighter text-foreground">
                                    {hotel.currency ? `${hotel.currency} ` : ""}
                                    {formatCurrency(hotel.estimatedPricePerNight)}
                                  </span>
                                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">/ Night</span>
                               </div>
                             )}

                             <div className="mt-4 flex flex-wrap gap-1.5">
                                {hotel.amenities.map((amenity, idx) => (
                                  <span key={idx} className="rounded border border-border bg-background px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                                     {amenity}
                                  </span>
                                ))}
                             </div>

                             <div className="mt-8">
                                {hotel.bookingLink ? (
                                  <button 
                                     onClick={() => window.open(hotel.bookingLink, "_blank")}
                                     className="w-full h-11 bg-black text-white text-[10px] font-black uppercase tracking-[0.15em] rounded-lg shadow-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                                  >
                                     View Provider Details <ExternalLink size={12} />
                                  </button>
                                ) : (
                                  <div className="flex h-11 w-full items-center justify-center rounded-lg border border-border bg-surface-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 cursor-not-allowed">
                                    Link Unavailable
                                  </div>
                                )}
                             </div>
                          </div>
                       </article>
                     ))}
                  </div>
               </section>

               {/* Tactical Intel */}
               <div className="space-y-20 border-t border-border pt-20">
                  <div className="grid gap-16 lg:grid-cols-2">
                     <section>
                        <h3 className="mb-8 text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Sector Advantages</h3>
                        <div className="space-y-4">
                           {activeZone.pros.map((pro, i) => (
                             <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-surface border border-border shadow-sm">
                                <Zap size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                <span className="text-xs font-bold uppercase tracking-tight text-foreground leading-relaxed">{pro}</span>
                             </div>
                           ))}
                        </div>
                     </section>
                     <section>
                        <h3 className="mb-8 text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Itinerary Clusters</h3>
                        <div className="flex flex-wrap gap-2">
                           {activeZone.nearbyPlaces.map((place, i) => (
                             <span key={i} className="rounded-lg border border-border bg-surface px-4 py-2 text-[11px] font-bold uppercase tracking-tight shadow-sm">{place}</span>
                           ))}
                        </div>
                     </section>
                  </div>

                  <section className="pb-20">
                     <h3 className="mb-8 text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Search Intelligence</h3>
                     <div className="grid gap-4 sm:grid-cols-2">
                        {searchSuggestions.filter(s => s.area === activeZone.areaName || s.area === destination).map((suggestion, i) => (
                          <button 
                            key={i}
                            onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(suggestion.query)}`, "_blank")}
                            className="flex items-center justify-between rounded-2xl border border-border bg-surface p-6 text-left hover:border-black transition-all group shadow-sm hover:shadow-xl"
                          >
                             <div className="flex items-center gap-4">
                                <div className="size-12 grid place-items-center rounded-xl bg-background border border-border text-muted-foreground group-hover:text-black shadow-inner transition-colors">
                                   <Search size={20} />
                                </div>
                                <div>
                                  <span className="block text-xs font-black uppercase tracking-widest text-foreground">{suggestion.label}</span>
                                  <span className="mt-1 block text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 leading-none">External Provider Search</span>
                                </div>
                             </div>
                             <ChevronRight size={18} className="text-muted-foreground/30 group-hover:text-black group-hover:translate-x-1 transition-all" />
                          </button>
                        ))}
                     </div>
                  </section>
               </div>
            </motion.div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
               <Bed size={80} strokeWidth={0.5} className="text-muted-foreground" />
               <p className="mt-8 text-[12px] font-black uppercase tracking-[0.3em] text-muted-foreground">Select a stay zone to review strategy</p>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
