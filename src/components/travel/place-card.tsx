"use client";

import { BookmarkCheck, MapPin, Plus, X } from "lucide-react";
import { addPlaceToItinerary, removeSelectedPlace } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { ProductCard, SourceBadge, StatusBadge } from "@/components/travel/studio";
import type { PlaceRecommendation } from "@/lib/types/travel";

export function PlaceCard({ place, selected = false }: { place: PlaceRecommendation; selected?: boolean }) {
  const action = selected ? removeSelectedPlace : addPlaceToItinerary;
  return (
    <ProductCard
      title={place.name}
      subtitle={place.location}
      selected={selected}
      action={<StatusBadge tone={selected ? "selected" : place.source.provider === "mock" ? "warm" : "emerald"}>{selected ? "Selected" : place.source.provider === "mock" ? "Suggested" : "Live"}</StatusBadge>}
      media={
        <div className="grid min-h-28 grid-cols-[1fr_84px] gap-3 p-4">
          <div className="flex flex-col justify-between">
            <SourceBadge provider={place.category} live={place.source.provider !== "mock"} />
            <div className="mt-6 flex items-end gap-4">
              <Metric label="Rating" value={typeof place.rating === "number" ? place.rating.toFixed(1) : "New"} />
              <Metric label="Cost" value={place.costLevel} />
              <Metric label="Gem" value={`${place.hiddenGemScore}`} />
            </div>
          </div>
          <div className="grid place-items-center rounded-[8px] border border-[rgba(132,215,208,0.22)] bg-[rgba(132,215,208,0.10)] text-[var(--cyan-2)]">
            <MapPin size={28} />
          </div>
        </div>
      }
    >
      <p className="text-sm leading-6 text-[var(--muted)]">{place.description}</p>
      <div className="rounded-[8px] border border-[rgba(132,215,208,0.18)] bg-[rgba(132,215,208,0.08)] p-3 text-sm leading-6 text-[var(--muted-2)]">
        {place.whyRecommended}
      </div>
      <form action={action}>
        <input type="hidden" name="placeId" value={place.id} />
        <Button type="submit" variant={selected ? "outline" : "default"} className="w-full">
          {selected ? <X /> : <Plus />}
          {selected ? "Remove from plan" : "Add to plan"}
        </Button>
      </form>
      {selected ? (
        <p className="flex items-center gap-2 text-xs font-bold text-[var(--amber-2)]">
          <BookmarkCheck size={14} />
          This place will feed the itinerary generator.
        </p>
      ) : null}
    </ProductCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">{label}</span>
      <span className="text-sm font-black text-[var(--foreground)]">{value}</span>
    </span>
  );
}
