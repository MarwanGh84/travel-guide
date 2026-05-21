"use client";

import { 
  MapPin, 
  ExternalLink, 
  Navigation, 
  X, 
  Star 
} from "lucide-react";
import Link from "next/link";
import { buildPlaceMapsUrl } from "./itinerary-utils";
import type { PlaceRecommendation } from "@/lib/types/travel";

type POIDetailProps = {
  selectedPlace: PlaceRecommendation | null;
  selectedPointName: string;
  onClose: () => void;
};

export function ItineraryPOIDetail({
  selectedPlace,
  selectedPointName,
  onClose,
}: POIDetailProps) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-6">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted">{selectedPlace ? "POI INTELLIGENCE" : "UNLINKED POINT"}</span>
        <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
          <X size={16} />
        </button>
      </header>
      
      <div className="flex-1 overflow-y-auto">
        {selectedPlace ? (
          <div className="p-8 space-y-10">
            <header>
              <div className="flex items-center gap-3 mb-4">
                <span className="rounded-full bg-foreground px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-background">POINT OF INTEREST</span>
                <span className="text-[10px] font-bold text-muted uppercase">{selectedPlace.category}</span>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground leading-none">{selectedPlace.name}</h2>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted leading-relaxed">{selectedPlace.location}</p>
              <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-muted">
                Source: {selectedPlace.source.provider}
              </p>
            </header>

            <section>
              <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Context</h3>
              <p className="text-sm font-medium leading-relaxed text-muted-2 italic">&quot;{selectedPlace.whyRecommended || selectedPlace.description}&quot;</p>
            </section>

            <div className="space-y-3">
              {selectedPlace.coordinates && (
                <>
                  <Link href="/map" className="block w-full">
                    <button className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-foreground text-[10px] font-black uppercase tracking-widest text-background shadow-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all">
                      <MapPin size={14} /> View on Map
                    </button>
                  </Link>
                  <button
                    onClick={() => window.open(buildPlaceMapsUrl(selectedPlace), "_blank")}
                    className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-background text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-all"
                  >
                    <Navigation size={14} /> Open Exact Location
                  </button>
                </>
              )}
              {!selectedPlace.coordinates && (
                <div className="rounded-lg border border-border bg-background px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted">
                  Map view unavailable because this place has no coordinates.
                </div>
              )}
              {!selectedPlace.coordinates && (
                <button 
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.name)}`, "_blank")}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-background text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-all"
                >
                  <Navigation size={14} /> Search in Google Maps
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-6">
            <header>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-muted">
                Unlinked itinerary point
              </span>
              <h2 className="mt-4 text-2xl font-black uppercase tracking-tight text-foreground">{selectedPointName}</h2>
            </header>
            <p className="text-sm leading-relaxed text-muted-2">
              This point is present in the AI-authored itinerary text, but it is not linked to a saved or provider-backed place record yet.
            </p>
            <div className="rounded-lg border border-border bg-background px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted">
              Map view unavailable until a matching place is saved from Discover.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
