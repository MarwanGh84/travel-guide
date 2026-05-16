import { BedDouble, ExternalLink, Plane, Search, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CopyTripSearchDetails } from "@/components/travel/copy-trip-search-details";
import { StudioPanel } from "@/components/travel/studio";
import { cn } from "@/lib/utils";
import { getExternalSearchLinks, getExternalSearchSummary, type TravelSearchContext } from "@/lib/travel/externalSearchLinks";

type ExternalSearchLinksProps = {
  trip: TravelSearchContext | null;
  compact?: boolean;
};

export function ExternalSearchLinks({ trip, compact = false }: ExternalSearchLinksProps) {
  const links = getExternalSearchLinks(trip);
  const summary = getExternalSearchSummary(trip);
  const hasTripDestination = Boolean(trip?.destination || trip?.destinationCountry);

  return (
    <StudioPanel
      title="Travel search shortcuts"
      eyebrow="External tools"
      action={compact ? undefined : <CopyTripSearchDetails text={summary.text} />}
    >
      <div className="grid gap-4">
        {compact ? <CopyTripSearchDetails text={summary.text} className="w-full" /> : null}
        <p className="flex items-center gap-2 text-sm leading-6 text-[var(--muted)]">
          <Search size={18} />
          Search outside the app, then import the real confirmation from Gmail.
        </p>
        {!hasTripDestination ? (
          <div className="rounded-[8px] bg-[rgba(216,183,106,0.10)] p-4 text-sm font-semibold leading-6 text-amber-200">
            Create a trip with a destination to make these shortcuts precise. For now they open generic provider searches.
          </div>
        ) : null}
        <div className={cn("grid gap-3", compact ? "grid-cols-1" : "md:grid-cols-2 xl:grid-cols-4")}>
        {links.map((link) => (
          <article key={link.id} className="flex min-h-48 flex-col justify-between rounded-[8px] bg-white/[0.045] p-4 ring-1 ring-[var(--line)] transition hover:-translate-y-1 hover:bg-[rgba(132,215,208,0.09)]">
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="flex size-10 items-center justify-center rounded-[8px] bg-white/5 text-[var(--foreground)] ring-1 ring-[var(--line)]">
                  {link.category === "Flights" ? <Plane size={18} /> : link.category === "Hotels" ? <BedDouble size={18} /> : <Ticket size={18} />}
                </span>
                <Badge variant={link.category === "Flights" || link.category === "Activities" ? "blue" : "secondary"}>{link.category}</Badge>
              </div>
              <p className="text-sm font-bold text-[var(--foreground)]">{link.provider}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{link.description}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-[var(--muted)]">{link.note}</p>
            </div>
            <a className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-4 w-full")} href={link.href} target="_blank" rel="noreferrer">
              {link.label}
              <ExternalLink size={15} />
            </a>
          </article>
        ))}
        </div>
      </div>
    </StudioPanel>
  );
}
