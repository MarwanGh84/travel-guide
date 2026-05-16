"use client";

import { useState } from "react";
import { 
  RefreshCw, 
  Sparkles, 
  MapPin, 
  Star, 
  Utensils, 
  Church, 
  ExternalLink,
  PlusCircle,
  XCircle,
  Search,
  Compass,
  Bookmark,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { addPlaceToItinerary, refreshDestinationsFromAi, refreshPlacesFromProvider, removeSelectedPlace, planDestination } from "@/app/actions";
import { imageForPlace } from "@/lib/travel/media";
import type { PlaceRecommendation, TripDraft, DestinationRecommendation } from "@/lib/types/travel";

type DiscoverWorkspaceProps = {
  trip: TripDraft | null;
  places: PlaceRecommendation[];
  destinations: DestinationRecommendation[];
  selectedIds: Set<string>;
};

export function DiscoverWorkspace({ trip, places = [], destinations = [], selectedIds = new Set() }: DiscoverWorkspaceProps) {
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [selectedDestinationId, setSelectedDestinationId] = useState(
    destinations.find((destination) =>
      destination.name === trip?.destination &&
      (!trip?.destinationCountry || destination.country === trip.destinationCountry)
    )?.id ?? ""
  );
  const [query, setQuery] = useState("");
  const [showDetail, setShowDetail] = useState(false);

  const categories = [
    { id: "destinations", label: "Destinations", icon: MapPin },
    { id: "all", label: "All Places", icon: Compass },
    { id: "saved", label: "Saved Places", icon: Bookmark },
    { id: "hidden", label: "Hidden Gems", icon: Star },
    { id: "food", label: "Dining", icon: Utensils },
    { id: "culture", label: "Culture", icon: Church },
  ];

  const filteredPlaces = places.filter((p) => {
    const haystack = `${p.name} ${p.category} ${p.location}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (activeCategoryId === "all") return true;
    if (activeCategoryId === "saved") return selectedIds.has(p.id);
    if (activeCategoryId === "hidden") return p.hiddenGemScore >= 50;
    if (activeCategoryId === "food") return /restaurant|cafe|bar|food/i.test(p.category);
    if (activeCategoryId === "culture") return /museum|temple|history|art/i.test(`${p.category} ${p.name}`);
    return true;
  });

  const filteredDestinations = destinations.filter((destination) => {
    if (!query) return true;
    return `${destination.name} ${destination.country}`.toLowerCase().includes(query.toLowerCase());
  });
  const isDestMode = activeCategoryId === "destinations";
  const activePlace = places.find((p) => p.id === selectedPlaceId);
  const activeDestination = destinations.find((d) => d.id === selectedDestinationId);
  const isSelected = activePlace ? selectedIds.has(activePlace.id) : false;

  const handleSelectPlace = (id: string) => {
    setSelectedPlaceId(id);
    setShowDetail(true);
  };

  const handleSelectDest = (id: string) => {
    setSelectedDestinationId(id);
    setShowDetail(true);
  };

  return (
    <div className="flex h-full w-full overflow-hidden flex-col lg:flex-row bg-background">
      {/* 1. Category Rail */}
      <aside className="flex w-full shrink-0 flex-col border-b border-border bg-surface lg:w-[200px] lg:border-b-0 lg:border-r">
        <div className="hidden lg:flex p-4 border-b border-border bg-background">
           <span className="text-[10px] font-black uppercase tracking-widest text-muted">Explorer</span>
        </div>
        <nav className="flex lg:flex-1 gap-1 overflow-x-auto p-2 scrollbar-hide">
           {categories.map((cat) => (
             <button
                key={cat.id}
                onClick={() => { setActiveCategoryId(cat.id); setShowDetail(false); }}
                className={cn(
                  "flex items-center gap-3 shrink-0 rounded-md px-3 py-2 text-xs font-medium transition-colors lg:w-full",
                  activeCategoryId === cat.id ? "bg-surface-2 text-foreground" : "text-muted hover:bg-surface-2/50"
                )}
             >
                <cat.icon size={14} className={activeCategoryId === cat.id ? "text-foreground" : "text-muted"} />
                <span className="lg:inline whitespace-nowrap">{cat.label}</span>
             </button>
           ))}
        </nav>
        <div className="hidden lg:block p-4 space-y-2 border-t border-border">
           <form action={refreshPlacesFromProvider}>
             <button className="flex w-full items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors">
                <RefreshCw size={10} /> Refresh Places
             </button>
           </form>
           <form action={refreshDestinationsFromAi}>
             <button className="flex w-full items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors">
                <Sparkles size={10} /> Get AI Ideas
             </button>
           </form>
        </div>
      </aside>

      {/* 2. List Pane */}
      <section className={cn(
        "flex w-full shrink-0 flex-col border-r border-border bg-background lg:w-[350px] transition-all",
        showDetail && "hidden lg:flex"
      )}>
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
           <div className="relative flex-1 mr-4">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                placeholder="Search..." 
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-7 w-full rounded-md border border-border bg-surface pl-8 pr-3 text-[11px] focus:border-black focus:ring-0"
              />
           </div>
           <span className="text-[10px] font-bold text-muted">{isDestMode ? filteredDestinations.length : filteredPlaces.length}</span>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-border/50">
           {isDestMode ? (
             filteredDestinations.map((dest) => (
               <button
                  key={dest.id}
                  onClick={() => handleSelectDest(dest.id)}
                  className={cn(
                    "flex w-full flex-col gap-1 p-4 text-left transition-all",
                    selectedDestinationId === dest.id ? "bg-surface-2 ring-1 ring-inset ring-border" : "hover:bg-surface"
                  )}
               >
                  <h4 className={cn("truncate text-xs font-bold uppercase tracking-tight", selectedDestinationId === dest.id ? "text-foreground" : "text-muted-2")}>{dest.name}</h4>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">{dest.country}</p>
               </button>
             ))
           ) : (
             filteredPlaces.map((place) => (
               <button
                  key={place.id}
                  onClick={() => handleSelectPlace(place.id)}
                  className={cn(
                    "flex w-full items-center gap-3 p-3 text-left transition-all",
                    selectedPlaceId === place.id ? "bg-surface-2 ring-1 ring-inset ring-border" : "hover:bg-surface"
                  )}
               >
                  <img src={imageForPlace(place)} alt="" className="size-10 rounded-md object-cover grayscale-[0.5]" />
                  <div className="min-w-0 flex-1">
                     <div className="flex items-center justify-between gap-2">
                        <h4 className={cn("truncate text-xs font-bold", selectedPlaceId === place.id ? "text-foreground" : "text-muted-2")}>
                          {place.name}
                        </h4>
                        {selectedIds.has(place.id) && <div className="size-1.5 shrink-0 rounded-full bg-black" />}
                     </div>
                     <p className="mt-1 truncate text-[10px] uppercase tracking-widest text-muted">{place.category}</p>
                  </div>
               </button>
             ))
           )}
           {((isDestMode && filteredDestinations.length === 0) || (!isDestMode && filteredPlaces.length === 0)) && (
             <div className="p-12 text-center text-muted opacity-40">
                <Compass size={32} className="mx-auto mb-4" strokeWidth={1} />
                <p className="text-[10px] font-bold uppercase tracking-widest">No entries found</p>
             </div>
           )}
        </div>
      </section>

      {/* 3. Detail Stage */}
      <main className={cn(
        "relative flex-1 overflow-y-auto bg-background p-6 lg:p-12 xl:p-24",
        !showDetail && "hidden lg:block"
      )}>
        <button 
           onClick={() => setShowDetail(false)}
           className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-black lg:hidden"
        >
           <ChevronLeft size={14} /> Back to list
        </button>

        <AnimatePresence mode="wait">
          {isDestMode ? (
            activeDestination ? (
              <motion.div
                key={activeDestination.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mx-auto max-w-2xl"
              >
                <header className="mb-12 border-b border-border pb-12">
                   <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8">
                      <div className="min-w-0">
                         <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-muted border border-border">
                            Destination Proposal
                         </span>
                         <h1 className="mt-6 text-3xl sm:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">{activeDestination.name}</h1>
                         <p className="mt-4 text-sm font-bold text-muted uppercase tracking-[0.2em]">{activeDestination.country}</p>
                      </div>
                      <form action={planDestination}>
                         <input type="hidden" name="destinationId" value={activeDestination.id} />
                         <button className="flex h-11 items-center gap-2 rounded-lg bg-black px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl hover:bg-zinc-800 transition-all">
                            <MapPin size={14} /> Commit Destination
                         </button>
                      </form>
                   </div>
                </header>

                <div className="space-y-16">
                   <section>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6">Alignment Logic</h3>
                      <p className="text-xl font-medium leading-relaxed text-foreground tracking-tight">{activeDestination.whyItMatches}</p>
                   </section>
                   
                   <div className="grid gap-12 sm:grid-cols-2">
                      <section className="rounded-xl border border-border bg-surface p-8 shadow-inner">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6 text-emerald-600">Strategic Advantages</h3>
                         <p className="text-sm font-medium leading-relaxed text-muted-2 uppercase tracking-wide">{activeDestination.pros}</p>
                      </section>
                      <section className="rounded-xl border border-border bg-surface p-8 shadow-inner">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6 text-rose-600">Known Constraints</h3>
                         <p className="text-sm font-medium leading-relaxed text-muted-2 uppercase tracking-wide">{activeDestination.cons}</p>
                      </section>
                   </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
                 <MapPin size={48} strokeWidth={1} />
                 <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em]">Select a destination to review</p>
              </div>
            )
          ) : (
            activePlace ? (
              <motion.div
                key={activePlace.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mx-auto max-w-2xl"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border shadow-sm grayscale-[0.2]">
                  <img src={imageForPlace(activePlace)} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                <header className="mt-12 border-b border-border pb-12 flex flex-col sm:flex-row sm:items-start justify-between gap-8">
                   <div className="min-w-0">
                      <div className="flex items-center gap-3">
                         <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-muted border border-border">
                            {activePlace.category}
                         </span>
                         {activePlace.hiddenGemScore >= 50 && (
                           <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase">
                             <Star size={10} fill="currentColor" /> Hidden Gem
                           </span>
                         )}
                      </div>
                      <h1 className="mt-6 text-3xl sm:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">{activePlace.name}</h1>
                      <p className="mt-4 flex items-center gap-2 text-xs text-muted font-bold uppercase tracking-widest">
                         <MapPin size={12} /> {activePlace.location}
                      </p>
                   </div>
                   
                   <form action={isSelected ? removeSelectedPlace : addPlaceToItinerary}>
                      <input type="hidden" name="placeId" value={activePlace.id} />
                      <button
                        className={cn(
                          "flex h-12 items-center gap-2 rounded-lg px-8 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl",
                          isSelected 
                            ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100" 
                            : "bg-black text-white hover:bg-zinc-800"
                        )}
                      >
                        {isSelected ? <XCircle size={14} /> : <PlusCircle size={14} />}
                        {isSelected ? "Drop" : "Stack"}
                      </button>
                   </form>
                </header>

                <div className="mt-12 grid gap-16 lg:grid-cols-[1fr_200px]">
                   <div className="space-y-12">
                      <section>
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6">Brief</h3>
                         <p className="text-xl font-medium leading-relaxed text-foreground tracking-tight">
                            {activePlace.description || "Curated intelligence for this sector. High alignment with trip profile."}
                         </p>
                      </section>
                      
                      <section className="rounded-xl bg-surface p-8 border border-border shadow-inner">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6">AI Context</h3>
                         <p className="text-sm italic font-medium leading-relaxed text-muted-2 uppercase tracking-wide">
                            {activePlace.whyRecommended || "Standard recommendation based on location popularity and category relevance."}
                         </p>
                      </section>
                   </div>

                   <div className="space-y-8">
                      <section>
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6">Telemetry</h3>
                         <div className="space-y-4">
                            <MetaItem label="Safety Index" value="Optimal" />
                            <MetaItem label="Cost Weight" value={activePlace.costLevel || "Standard"} />
                            <MetaItem label="Intensity" value="Moderate" />
                         </div>
                      </section>
                      
                      <button className="w-full h-10 rounded-md border border-border bg-background text-[9px] font-black uppercase tracking-widest text-muted hover:text-black hover:border-black transition-all" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activePlace.name)}`, "_blank")}>
                         <ExternalLink size={10} className="inline mr-2" /> Google Maps
                      </button>
                   </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
                 <Compass size={48} strokeWidth={1} />
                 <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em]">Select an entity to review details</p>
              </div>
            )
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-2">
       <span className="text-[9px] font-medium text-muted uppercase tracking-widest">{label}</span>
       <span className="text-[10px] font-black text-foreground uppercase">{value}</span>
    </div>
  );
}
