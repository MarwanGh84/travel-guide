"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, 
  Loader2, 
  MapPin, 
  CloudSun, 
  Plane, 
  Bed, 
  Star, 
  ExternalLink, 
  XCircle, 
  PlusCircle, 
  Calendar, 
  ChevronDown,
  CheckCircle2,
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { imageForPlace } from "@/lib/travel/media";
import type { PlaceRecommendation, DestinationRecommendation } from "@/lib/types/travel";
import type { LiveEvent } from "@/lib/api/eventsService";
import { formatProvider } from "./utils";

type Status = { tone: "success" | "error" | "info"; message: string } | null;

type DetailPaneProps = {
  showDetail: boolean;
  setShowDetail: (val: boolean) => void;
  status: Status;
  isDestMode: boolean;
  isEventsMode: boolean;
  activeDestination?: DestinationRecommendation;
  activeEvent?: LiveEvent;
  activePlace?: PlaceRecommendation;
  isPending: boolean;
  isCommittedDestination: boolean;
  isSelected: boolean;
  usedPlaceRecommendationIds: Set<string>;
  itineraryDays: Array<{ id: string; date: string; theme: string }>;
  chooserOpen: boolean;
  setChooserOpen: (val: boolean) => void;
  onCommitDest: (formData: FormData) => void;
  onPlaceAction: (formData: FormData) => void;
  onUseInItinerary: (dayId: string, timeOfDay: string) => void;
  onGoToTimeline: () => void;
};

export function DetailPane({
  showDetail,
  setShowDetail,
  status,
  isDestMode,
  isEventsMode,
  activeDestination,
  activeEvent,
  activePlace,
  isPending,
  isCommittedDestination,
  isSelected,
  usedPlaceRecommendationIds,
  itineraryDays,
  chooserOpen,
  setChooserOpen,
  onCommitDest,
  onPlaceAction,
  onUseInItinerary,
  onGoToTimeline,
}: DetailPaneProps) {
  return (
    <main className={cn(
      "relative flex-1 overflow-y-auto bg-background p-6 lg:p-12 xl:p-16 scrollbar-hide",
      !showDetail && "hidden lg:block"
    )}>
      <button 
         onClick={() => setShowDetail(false)}
         className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground lg:hidden"
      >
         <ChevronLeft size={14} /> Back to tactical list
      </button>

      {status && (
        <div
          className={cn(
            "mb-6 rounded-lg border px-4 py-3 text-[10px] font-black uppercase tracking-widest",
            status.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            status.tone === "error" && "border-rose-200 bg-rose-50 text-rose-700",
            status.tone === "info" && "border-border bg-surface text-muted",
          )}
        >
          {status.message}
        </div>
      )}

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
                       <div className="mt-3 flex flex-wrap gap-2">
                         <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-muted">
                           {activeDestination.source.classification === "ai" ? "AI estimate" : activeDestination.source.provider}
                         </span>
                         {activeDestination.source.classification === "ai" && (
                           <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-muted">
                             Not live provider data
                           </span>
                         )}
                         {isCommittedDestination && (
                           <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-700">
                             Committed
                           </span>
                         )}
                       </div>
                       <h1 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-foreground leading-[0.95]">{activeDestination.name}</h1>
                       <p className="mt-4 text-[10px] font-bold text-muted uppercase tracking-[0.3em]">{activeDestination.country}</p>
                    </div>
                    <form action={onCommitDest}>
                       <input type="hidden" name="destinationId" value={activeDestination.id} />
                       <button 
                         disabled={isPending}
                         className="flex h-12 items-center gap-2 rounded-lg bg-foreground px-8 text-[10px] font-black uppercase tracking-widest text-background shadow-2xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50"
                       >
                          {isPending ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />} Commit Destination
                       </button>
                    </form>
                 </div>
              </header>

              <div className="space-y-12">
                 <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6">Alignment Logic</h3>
                    <p className="text-xl sm:text-2xl font-black leading-[1.2] text-foreground tracking-tight max-w-[50ch]">{activeDestination.whyItMatches}</p>
                 </section>

                 {activeDestination.source.classification === "ai" && (
                   <section className="rounded-2xl border-2 border-border bg-surface p-8 shadow-inner">
                     <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Rough Estimates</h3>
                     <p className="mb-6 text-[10px] italic leading-relaxed text-muted/70 normal-case tracking-normal">
                       AI-generated ballpark figures — always confirm live prices and weather before booking.
                     </p>
                     <div className="space-y-4 text-[10px] font-black uppercase tracking-widest text-muted-2">
                       <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                          <CloudSun size={14} className="text-foreground" />
                          <span>Weather: ~{activeDestination.weatherSummary}</span>
                       </div>
                       <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                          <Plane size={14} className="text-foreground" />
                          <span>Flight: ~{activeDestination.flightEstimate}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <Bed size={14} className="text-foreground" />
                          <span>Hotel: ~{activeDestination.hotelEstimate}</span>
                       </div>
                     </div>
                   </section>
                 )}
                 
                 <div className="grid gap-6 sm:grid-cols-2">
                    <section className="rounded-2xl border-2 border-border bg-surface p-8 shadow-inner transition-all hover:border-emerald-500/30 group">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6 text-emerald-600">Strategic Advantages</h3>
                       <p className="text-[11px] font-black leading-relaxed text-muted-2 uppercase tracking-wide group-hover:text-foreground transition-colors">{activeDestination.pros}</p>
                    </section>
                    <section className="rounded-2xl border-2 border-border bg-surface p-8 shadow-inner transition-all hover:border-rose-500/30 group">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6 text-rose-600">Known Constraints</h3>
                       <p className="text-[11px] font-black leading-relaxed text-muted-2 uppercase tracking-wide group-hover:text-foreground transition-colors">{activeDestination.cons}</p>
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
        ) : isEventsMode ? (
          activeEvent ? (
            <motion.div
              key={activeEvent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-8 space-y-10"
            >
              <header>
                 <div className="flex items-center gap-3 mb-4">
                    <span className="rounded-full bg-foreground px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-background">LIVE EVENT</span>
                 </div>
                 <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground leading-none">{activeEvent.name}</h2>
                 <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted leading-relaxed">{activeEvent.date}</p>
              </header>

              {activeEvent.thumbnail && (
                 <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border shadow-sm relative">
                    <Image 
                      src={activeEvent.thumbnail} 
                      alt={activeEvent.name} 
                      fill 
                      className="object-cover" 
                    />
                 </div>
              )}

              <div className="space-y-8">
                 <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4">Venue Logistics</h3>
                    <div className="rounded-xl border border-border bg-surface-2 p-5 space-y-3">
                       <div className="flex items-center gap-3">
                          <MapPin size={14} className="text-foreground" />
                          <span className="text-xs font-bold text-foreground">{activeEvent.venue}</span>
                       </div>
                       {activeEvent.address && <p className="text-[9px] font-black text-muted uppercase tracking-widest ml-7">{activeEvent.address}</p>}
                    </div>
                 </section>

                 {activeEvent.description && (
                   <section>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4">Operational Brief</h3>
                      <p className="text-sm font-medium leading-relaxed text-muted-foreground uppercase tracking-tight line-clamp-[10]">{activeEvent.description}</p>
                   </section>
                 )}

                 <div className="pt-8 border-t border-border">
                    <a 
                      href={activeEvent.link} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-foreground text-[10px] font-black uppercase tracking-widest text-background shadow-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95"
                    >
                       Get Credentials <ExternalLink size={14} />
                    </a>
                 </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
               <Calendar size={48} strokeWidth={1} />
               <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em]">Select an event to review details</p>
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
                <Image
                  src={imageForPlace(activePlace)}
                  alt={activePlace.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 672px"
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              <header className="mt-12 border-b border-border pb-12 flex flex-col sm:flex-row sm:items-start justify-between gap-8">
                 <div className="min-w-0">
                    <div className="flex items-center gap-3">
                       <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-muted border border-border">
                          {activePlace.category}
                       </span>
                       {activePlace.isHiddenGem && (
                         <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase">
                           <Star size={10} fill="currentColor" /> Hidden Gem
                         </span>
                       )}
                    </div>
                    <h1 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-foreground leading-[0.95]">{activePlace.name}</h1>
                    <p className="mt-4 flex items-center gap-2 text-[10px] text-muted font-bold uppercase tracking-[0.3em]">
                       <MapPin size={12} className="text-foreground" /> {activePlace.location}
                    </p>
                 </div>
                 
                 <div className="flex flex-col gap-2 shrink-0 sm:w-48">
                    <form action={onPlaceAction} className="w-full">
                       <input type="hidden" name="placeId" value={activePlace.id} />
                       <button
                         className={cn(
                           "flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-[9px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95",
                           isSelected 
                             ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50 dark:hover:bg-rose-900/30" 
                             : "bg-foreground text-background hover:bg-zinc-800 dark:hover:bg-zinc-200"
                         )}
                       >
                         {isSelected ? <XCircle size={14} /> : <PlusCircle size={14} />}
                         {isSelected ? "Drop from Stack" : "Add to Stack"}
                       </button>
                    </form>

                    {isSelected && (
                      <div className="relative w-full">
                        {usedPlaceRecommendationIds.has(activePlace.id) ? (
                          <div className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50">
                             <CheckCircle2 size={14} /> In Itinerary
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setChooserOpen(!chooserOpen)}
                              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-[9px] font-black uppercase tracking-widest text-foreground shadow-sm hover:bg-background transition-all"
                            >
                              <Calendar size={14} /> Use in Timeline <ChevronDown size={12} className={cn("transition-transform", chooserOpen && "rotate-180")} />
                            </button>

                            <AnimatePresence>
                              {chooserOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  className="absolute top-full left-0 z-50 mt-2 w-full min-w-[240px] overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
                                >
                                  {itineraryDays.length > 0 ? (
                                    <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide">
                                      {itineraryDays.map((day) => (
                                        <div key={day.id} className="mb-2 last:mb-0">
                                          <p className="px-2 py-1 text-[8px] font-black uppercase tracking-widest text-muted">{day.date} — {day.theme}</p>
                                          <div className="grid grid-cols-3 gap-1 mt-1">
                                            {["morning", "afternoon", "evening"].map((segment) => (
                                              <button
                                                key={segment}
                                                onClick={() => onUseInItinerary(day.id, segment)}
                                                className="flex h-8 items-center justify-center rounded-md border border-border bg-surface text-[8px] font-black uppercase tracking-tighter text-muted hover:bg-foreground hover:text-background hover:border-foreground transition-all"
                                              >
                                                {segment}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="p-6 text-center">
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Generate itinerary first</p>
                                      <button 
                                        onClick={onGoToTimeline}
                                        className="mt-3 text-[9px] font-black uppercase tracking-widest text-foreground underline underline-offset-4"
                                      >
                                        Go to Timeline
                                      </button>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </div>
                    )}
                 </div>
              </header>

              <div className="mt-12 grid gap-16 lg:grid-cols-[1fr_200px]">
                 <div className="space-y-12">
                    <section>
                       <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6">Brief</h3>
                       <p className="text-xl font-medium leading-relaxed text-foreground tracking-tight">
                          {activePlace.description || "Curated intelligence for this sector. High alignment with trip profile."}
                       </p>
                    </section>

                    <PlaceReviews name={activePlace.name} location={activePlace.location} />
                    
                    <section className="rounded-xl bg-surface p-8 border border-border shadow-inner">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6">Discovery Source</h3>
                       <p className="text-sm font-bold leading-relaxed text-muted-2 uppercase tracking-wide">
                          {activePlace.whyRecommended || "Standard recommendation based on location popularity and category relevance."}
                       </p>
                       <div className="mt-4 flex flex-wrap gap-2">
                         <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-muted">
                           Source: {formatProvider(activePlace.source?.provider)}
                         </span>
                         <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-muted">
                           {activePlace.source?.classification === "provider" ? "Provider data" : activePlace.source?.classification ?? "Unknown"}
                         </span>
                       </div>
                    </section>
                 </div>

                 <div className="space-y-8">
                    <section>
                       <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6">Telemetry</h3>
                       <div className="space-y-4">
                          <MetaItem label="Rating Index" value={activePlace.rating?.toString() || "Optimal"} />
                          <MetaItem label="Cost Weight" value={activePlace.costLevel || "Standard"} />
                          <MetaItem label="Intensity" value="Moderate" />
                       </div>
                    </section>
                    
                    <button className="w-full h-10 rounded-md border border-border bg-background text-[9px] font-black uppercase tracking-widest text-muted hover:text-foreground hover:border-foreground transition-all" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activePlace.name)}`, "_blank")}>
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

type PlaceReviewItem = { author?: string; rating?: number; text: string; relativeTime?: string };
type ReviewsData = {
  ok: boolean;
  note: string;
  rating?: number;
  totalRatings?: number;
  reviews: PlaceReviewItem[];
};

function PlaceReviews({ name, location }: { name: string; location: string }) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loadedKey, setLoadedKey] = useState("");
  const key = `${name}|${location}`;

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ name });
    if (location) params.set("location", location);
    fetch(`/api/places/reviews?${params.toString()}`)
      .then((res) => res.json())
      .then((result) => {
        if (cancelled) return;
        setData({
          ok: Boolean(result.ok),
          note: result.note ?? "",
          rating: result.rating,
          totalRatings: result.totalRatings,
          reviews: Array.isArray(result.reviews) ? result.reviews : [],
        });
        setLoadedKey(key);
      })
      .catch(() => {
        if (cancelled) return;
        setData({ ok: false, note: "Could not load reviews.", reviews: [] });
        setLoadedKey(key);
      });
    return () => {
      cancelled = true;
    };
  }, [key, name, location]);

  const loading = loadedKey !== key;
  const state = data ?? { ok: false, note: "", reviews: [] };

  if (loading) {
    return (
      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6">Traveler Reviews</h3>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
          <Loader2 size={12} className="animate-spin" /> Loading reviews
        </div>
      </section>
    );
  }

  if (!state.ok || state.reviews.length === 0) return null;

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Traveler Reviews</h3>
        {typeof state.rating === "number" && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-foreground">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {state.rating.toFixed(1)}
            {state.totalRatings ? <span className="text-muted">({state.totalRatings.toLocaleString()})</span> : null}
          </span>
        )}
      </div>
      <div className="space-y-4">
        {state.reviews.map((review, index) => (
          <article key={index} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-wide text-foreground">{review.author ?? "Google reviewer"}</span>
              {typeof review.rating === "number" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-500">
                  <Star size={10} className="fill-amber-400 text-amber-400" /> {review.rating}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80 line-clamp-5">{review.text}</p>
            {review.relativeTime && (
              <span className="mt-2 block text-[9px] font-bold uppercase tracking-widest text-muted">{review.relativeTime}</span>
            )}
          </article>
        ))}
      </div>
      <p className="mt-3 text-[9px] font-bold uppercase tracking-widest text-muted/60">Source: Google</p>
    </section>
  );
}


