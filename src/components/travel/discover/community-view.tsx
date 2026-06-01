"use client";

import { cn } from "@/lib/utils";
import { Loader2, Users, ExternalLink, Sparkles, Utensils } from "lucide-react";
import type { CommunityRecommendation } from "@/lib/types/travel";

type CommunityViewProps = {
  isFetching: boolean;
  notConnected: boolean;
  items: CommunityRecommendation[];
  focus: "hidden-gems" | "restaurants";
  onChangeFocus: (focus: "hidden-gems" | "restaurants") => void;
  destination: string;
};

export function CommunityView({
  isFetching,
  notConnected,
  items,
  focus,
  onChangeFocus,
  destination,
}: CommunityViewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
      <header className="border-b border-border pb-6">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted">From the Web</span>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-tighter text-foreground">Community Picks</h2>
        <p className="mt-2 text-xs text-muted leading-relaxed">
          Real, recent recommendations pulled from Reddit threads, local blogs, and guides for {destination || "your destination"}.
        </p>
        <div className="mt-4 flex gap-2">
          <FocusChip active={focus === "hidden-gems"} onClick={() => onChangeFocus("hidden-gems")} icon={Sparkles} label="Hidden gems" />
          <FocusChip active={focus === "restaurants"} onClick={() => onChangeFocus("restaurants")} icon={Utensils} label="Local food" />
        </div>
      </header>

      {isFetching && (
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
          <Loader2 size={12} className="animate-spin" /> Searching the web
        </div>
      )}

      {!isFetching && notConnected && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center gap-2 text-muted mb-3">
            <Users size={16} />
            <span className="text-[11px] font-black uppercase tracking-widest">Web search not connected</span>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Add a <span className="font-mono text-foreground">PERPLEXITY_API_KEY</span> to surface up-to-date local recommendations
            from across the web here, complete with cited sources. Until then, the other tabs use Google Places, OpenStreetMap, and Wikivoyage.
          </p>
        </div>
      )}

      {!isFetching && !notConnected && items.length === 0 && (
        <div className="py-16 text-center opacity-40">
          <Users size={40} className="mx-auto mb-4" strokeWidth={1} />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted">No community picks found for this search</p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-border bg-background p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-black uppercase tracking-tight text-foreground">{item.name}</h3>
                <p className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-muted">{item.category}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{item.summary}</p>
            {item.sources.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-4">
                {item.sources.map((source, i) => (
                  <a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-muted hover:text-foreground hover:border-foreground transition-colors"
                  >
                    <ExternalLink size={9} /> {source.title}
                  </a>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function FocusChip({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Sparkles;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
        active ? "bg-foreground text-background border-foreground" : "border-border text-muted hover:border-foreground hover:text-foreground",
      )}
    >
      <Icon size={11} /> {label}
    </button>
  );
}
