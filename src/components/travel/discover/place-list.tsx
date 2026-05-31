"use client";

import { cn } from "@/lib/utils";
import { Search, Loader2, RefreshCw, Compass, MapPin } from "lucide-react";
import Image from "next/image";
import { imageForPlace } from "@/lib/travel/media";
import type { PlaceRecommendation, DestinationRecommendation } from "@/lib/types/travel";
import { formatProvider, getProviderStyles } from "./utils";

type PlaceListProps = {
  isDestMode: boolean;
  query: string;
  onQueryChange: (val: string) => void;
  filteredDestinations: DestinationRecommendation[];
  filteredPlaces: PlaceRecommendation[];
  selectedDestinationId: string;
  selectedPlaceId: string;
  onSelectDest: (id: string) => void;
  onSelectPlace: (id: string) => void;
  selectedIds: Set<string>;
  hasNoDataYet: boolean;
  isPending: boolean;
  onRefreshPlaces: () => void;
  onRefreshAI: () => void;
};

export function PlaceList({
  isDestMode,
  query,
  onQueryChange,
  filteredDestinations,
  filteredPlaces,
  selectedDestinationId,
  selectedPlaceId,
  onSelectDest,
  onSelectPlace,
  selectedIds,
  hasNoDataYet,
  isPending,
  onRefreshPlaces,
  onRefreshAI,
}: PlaceListProps) {
  return (
    <section className="flex w-full shrink-0 flex-col border-r border-border bg-background lg:w-[350px]">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
         <div className="relative flex-1 mr-4">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              placeholder="Filter places..." 
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="h-7 w-full rounded-md border border-border bg-surface pl-8 pr-3 text-[11px] focus:border-foreground focus:ring-0"
            />
         </div>
         <span className="text-[10px] font-bold text-muted">{isDestMode ? filteredDestinations.length : filteredPlaces.length}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto divide-y divide-border/50 scrollbar-hide">
         {hasNoDataYet && (
           <div className="p-8 text-center">
             <Loader2 size={32} className="mx-auto mb-4 animate-spin text-muted" strokeWidth={1} />
             <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
               Preparing destination ideas and live places
             </p>
             <p className="mt-3 text-xs leading-5 text-muted">
               Discovery is still warming up for this trip. Retry if provider data takes longer than expected.
             </p>
             <button
               onClick={onRefreshPlaces}
               disabled={isPending}
               className="mt-5 inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-4 text-[10px] font-black uppercase tracking-widest text-foreground transition-colors hover:bg-surface-2 disabled:opacity-50"
             >
               {isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
               Retry places
             </button>
           </div>
         )}
         {isDestMode ? (
           filteredDestinations.map((dest) => (
             <button
                key={dest.id}
                onClick={() => onSelectDest(dest.id)}
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
                onClick={() => onSelectPlace(place.id)}
                className={cn(
                  "flex w-full items-center gap-3 p-3 text-left transition-all",
                  selectedPlaceId === place.id ? "bg-surface-2 ring-1 ring-inset ring-border" : "hover:bg-surface"
                )}
             >
                <Image
                  src={imageForPlace(place, 80, 80)}
                  alt={place.name}
                  width={40}
                  height={40}
                  className="size-10 rounded-md object-cover grayscale-[0.5]"
                  unoptimized
                />
                <div className="min-w-0 flex-1">
                   <div className="flex items-center justify-between gap-2">
                      <h4 className={cn("truncate text-xs font-bold", selectedPlaceId === place.id ? "text-foreground" : "text-muted-2")}>
                        {place.name}
                      </h4>
                      {selectedIds.has(place.id) && <div className="size-1.5 shrink-0 rounded-full bg-foreground" />}
                   </div>
                   <div className="mt-1.5 flex min-w-0 items-center gap-2">
                     <p className="truncate text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">{place.category}</p>
                     <span className={cn(
                       "shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest",
                       getProviderStyles(place.source?.provider)
                     )}>
                       {formatProvider(place.source?.provider)}
                     </span>
                   </div>
                </div>
             </button>
           ))
         )}
         {!hasNoDataYet && ((isDestMode && filteredDestinations.length === 0) || (!isDestMode && filteredPlaces.length === 0)) && (
           <div className="p-8 text-center">
              <Compass size={32} className="mx-auto mb-4 text-muted" strokeWidth={1} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                {isDestMode ? "No destination ideas yet" : "No places in this view"}
              </p>
              <button 
                onClick={isDestMode ? onRefreshAI : onRefreshPlaces}
                disabled={isPending}
                className="mt-5 inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-4 text-[10px] font-black uppercase tracking-widest text-foreground transition-colors hover:bg-surface-2 disabled:opacity-50"
              >
                {isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Retry
              </button>
           </div>
         )}
      </div>
    </section>
  );
}


