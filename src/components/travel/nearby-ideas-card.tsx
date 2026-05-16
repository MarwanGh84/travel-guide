"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PlaceRecommendation } from "@/lib/types/travel";

export function NearbyIdeasCard({ places }: { places: PlaceRecommendation[] }) {
  const [selected, setSelected] = useState(places[0] ?? null);

  if (!places.length) {
    return <p className="rounded-[8px] bg-white/[0.045] p-3 font-semibold text-[var(--muted)]">Refresh places data in Discover.</p>;
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        {places.slice(0, 4).map((place) => (
          <button
            key={place.id}
            type="button"
            onClick={() => setSelected(place)}
            className="rounded-[8px] bg-white/[0.045] p-3 text-left font-semibold text-[var(--muted-2)] transition hover:bg-[rgba(132,215,208,0.09)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]"
          >
            <span className="flex items-center justify-between gap-3">
              <span>{place.name}</span>
              <Badge>{place.category}</Badge>
            </span>
          </button>
        ))}
      </div>
      {selected ? (
        <div className="rounded-[8px] border border-sky-300/25 bg-sky-400/10 p-3">
          <p className="text-sm font-bold text-[var(--foreground)]">{selected.name}</p>
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[var(--muted)]">
            <MapPin />
            {selected.location}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{selected.whyRecommended}</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="flex items-center gap-1 text-xs font-bold text-[var(--muted)]">
              <Star />
              {selected.rating?.toFixed(1) ?? "N/A"}
            </span>
            <Link href="/map">
              <Button size="sm" variant="secondary">View on map</Button>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
