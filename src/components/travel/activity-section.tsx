import { Clock, ExternalLink, Star, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { StudioPanel } from "@/components/travel/studio";
import { searchActivities, type ActivityResult } from "@/lib/api/activitiesService";
import { getExternalSearchLinks, getExternalSearchSummary, type TravelSearchContext } from "@/lib/travel/externalSearchLinks";
import { cn, formatCurrency } from "@/lib/utils";

type ActivitySectionProps = {
  trip: TravelSearchContext | null;
};

export async function ActivitySection({ trip }: ActivitySectionProps) {
  const summary = getExternalSearchSummary(trip);
  const getYourGuideLink = getExternalSearchLinks(trip).find((link) => link.id === "getyourguide-activities");
  let activities: ActivityResult[] = [];
  let error = "";

  try {
    activities = await searchActivities({
      destination: summary.destination,
      startDate: typeof trip?.startDate === "string" ? trip.startDate : trip?.startDate?.toISOString().slice(0, 10),
      endDate: typeof trip?.endDate === "string" ? trip.endDate : trip?.endDate?.toISOString().slice(0, 10),
      currency: "USD",
      limit: 6,
    });
  } catch (activityError) {
    error = activityError instanceof Error ? activityError.message : "GetYourGuide activities could not be loaded.";
  }

  const hasLiveActivities = activities.length > 0;

  return (
    <StudioPanel
      className="mt-6"
      title="Tours and activities"
      eyebrow={`GetYourGuide scoped to ${summary.destination}`}
      action={<Badge variant={hasLiveActivities ? "live" : "blue"}>{hasLiveActivities ? "Live" : "Shortcut"}</Badge>}
    >
      <div className="grid gap-4">
        <p className="flex items-center gap-2 text-sm leading-6 text-[var(--muted)]">
          <Ticket className="text-[var(--cyan)]" />
          Use this for tours, tickets, day trips, and guided activities.
        </p>
        {error ? (
          <div className="rounded-[8px] bg-[rgba(216,183,106,0.10)] p-4 text-sm font-semibold leading-6 text-amber-200">
            {error} The external GetYourGuide search still works below.
          </div>
        ) : null}

        {hasLiveActivities ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {activities.map((activity) => (
              <ActivityCard key={activity.id ?? activity.title} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="rounded-[8px] bg-white/[0.045] p-5 ring-1 ring-[var(--line)]">
            <p className="text-sm font-bold text-[var(--foreground)]">Search GetYourGuide for {summary.destination}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Live Partner API tours need approved GetYourGuide access. Until then, this opens a destination-specific GetYourGuide search using your trip details.
            </p>
          </div>
        )}

        {getYourGuideLink ? (
          <a className={cn(buttonVariants({ variant: "secondary" }), "justify-self-start")} href={getYourGuideLink.href} target="_blank" rel="noreferrer">
            {hasLiveActivities ? "Open more tours" : getYourGuideLink.label}
            <ExternalLink size={16} />
          </a>
        ) : null}
      </div>
    </StudioPanel>
  );
}

function ActivityCard({ activity }: { activity: ActivityResult }) {
  return (
    <article className="flex min-h-64 flex-col justify-between rounded-[8px] bg-white/[0.045] p-4 ring-1 ring-[var(--line)] transition hover:-translate-y-1 hover:bg-[rgba(132,215,208,0.09)]">
      <div>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--foreground)]">{activity.title}</p>
            <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{activity.category}</p>
          </div>
          <Badge variant="live">GetYourGuide</Badge>
        </div>
        {activity.description ? (
          <p className="line-clamp-4 text-sm leading-6 text-[var(--muted)]">{activity.description}</p>
        ) : null}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <MiniMetric label="Price" value={activity.estimatedPrice ? formatCurrency(activity.estimatedPrice) : "Varies"} />
          <MiniMetric label="Duration" value={activity.duration} />
        </div>
        {activity.rating ? (
          <p className="mt-3 flex items-center gap-1 text-xs font-bold text-[var(--muted)]">
            <Star size={14} className="fill-amber-300 text-amber-500" />
            {activity.rating.toFixed(1)}
            {activity.reviewCount ? ` · ${activity.reviewCount} reviews` : ""}
          </p>
        ) : null}
      </div>
      {activity.bookingLink ? (
        <a className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 w-full")} href={activity.bookingLink} target="_blank" rel="noreferrer">
          <Clock size={15} />
          View tour
          <ExternalLink size={15} />
        </a>
      ) : null}
    </article>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-white/5 p-2 ring-1 ring-[var(--line)]">
      <p className="text-xs font-bold text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-bold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
