import { ArrowRight, Plane, Star } from "lucide-react";
import { planDestination } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { ProductCard, SourceBadge, StatusBadge } from "@/components/travel/studio";
import type { DestinationRecommendation } from "@/lib/types/travel";

export function DestinationCard({ destination }: { destination: DestinationRecommendation }) {
  return (
    <ProductCard
      title={destination.name}
      subtitle={destination.country}
      media={
        <div className="relative min-h-44 overflow-hidden p-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(132,215,208,0.24),transparent_16rem),radial-gradient(circle_at_90%_80%,rgba(216,183,106,0.26),transparent_18rem)]" />
          <div className="relative flex h-full min-h-36 flex-col justify-between">
            <div className="flex items-center justify-between gap-3">
              <SourceBadge provider={destination.source.provider} live={destination.source.classification === "provider"} />
              <StatusBadge tone="warm">{destination.confidenceScore}% match</StatusBadge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <MiniStat label="Est. cost" value={`~$${destination.estimatedCost.toLocaleString()}`} />
              <MiniStat label="Duration" value={destination.suggestedTripDuration} />
            </div>
          </div>
        </div>
      }
    >
      <p className="text-sm leading-6 text-[var(--muted)]">{destination.whyItMatches}</p>
      <div className="flex flex-wrap gap-2">
        {destination.bestFor.slice(0, 4).map((item) => <StatusBadge key={item}>{item}</StatusBadge>)}
      </div>
      <div className="grid gap-2 text-sm leading-6 text-[var(--muted)]">
        <p><Star className="mr-2 inline text-[var(--amber)]" />{destination.bestThingsToDo.slice(0, 3).join(", ")}</p>
      </div>
      <div className="rounded-[8px] border border-border bg-surface-2 p-3 text-sm leading-6 text-[var(--muted)]">
        <div className="mb-2 flex flex-wrap gap-2">
          <StatusBadge tone="warm">AI estimate</StatusBadge>
          <StatusBadge>Not live provider data</StatusBadge>
        </div>
        <p><Plane className="mr-2 inline text-[var(--cyan)]" />{destination.flightEstimate}</p>
        <p>Weather assumption: {destination.weatherSummary}</p>
        <p>Hotel assumption: {destination.hotelEstimate}</p>
      </div>
      <form action={planDestination}>
        <input type="hidden" name="destinationId" value={destination.id} />
        <Button type="submit" variant="warm" className="w-full">
          Plan this destination
          <ArrowRight />
        </Button>
      </form>
    </ProductCard>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-border bg-surface-2 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-black text-[var(--foreground)]">{value}</p>
    </div>
  );
}
