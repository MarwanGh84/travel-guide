"use client";

import { cn } from "@/lib/utils";
import { Globe, Navigation, Star, History, CheckCircle2, Info, Loader2, RefreshCw, type LucideIcon } from "lucide-react";
import type { TripDraft } from "@/lib/types/travel";

type Intelligence = {
  overview: string | null;
  neighborhoods: string[];
  culture: string | null;
  history: string | null;
  practicalNotes: string[];
  source: string;
};

type IntelViewProps = {
  trip: TripDraft | null;
  intelligence?: Intelligence | null;
  isPending: boolean;
  onRefreshPlaces: () => void;
};

export function IntelView({
  trip,
  intelligence,
  isPending,
  onRefreshPlaces,
}: IntelViewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-10 scrollbar-hide">
      <header>
         <span className="text-[10px] font-black uppercase tracking-widest text-muted">Sector Intelligence</span>
         <h2 className="mt-2 text-2xl font-black uppercase tracking-tighter text-foreground">{trip?.destination || "Unknown Sector"}</h2>
      </header>

      {intelligence ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-500">
           <IntelSection icon={Globe} title="Overview" content={intelligence.overview} />
           
           <section>
              <div className="flex items-center gap-3 mb-4 text-[10px] font-black uppercase tracking-widest text-muted">
                 <Navigation size={14} className="text-foreground" />
                 Neighborhoods
              </div>
              <div className="flex flex-wrap gap-2">
                 {intelligence.neighborhoods.length > 0 ? (
                   intelligence.neighborhoods.map((n, i) => (
                     <span key={i} className="rounded-md border border-border bg-surface px-3 py-1 text-[10px] font-bold uppercase tracking-tight">{n}</span>
                   ))
                 ) : (
                   <span className="text-[10px] font-bold text-muted uppercase">Intelligence pending for this sector.</span>
                 )}
              </div>
           </section>

           <IntelSection icon={Star} title="Culture" content={intelligence.culture} />
           <IntelSection icon={History} title="Background" content={intelligence.history} />
           
           {intelligence.practicalNotes.length > 0 && (
             <section className="space-y-6">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted">
                   <CheckCircle2 size={14} className="text-foreground" />
                   Tactical Notes
                </div>
                <div className="space-y-4">
                   {intelligence.practicalNotes.map((note, i) => (
                     <div key={i} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-tight text-foreground mb-1">
                           {note.split(":")[0]}
                        </p>
                        <p className="text-[11px] font-medium leading-relaxed text-muted-2 uppercase tracking-wide">
                           {note.split(":").slice(1).join(":").trim()}
                        </p>
                     </div>
                   ))}
                </div>
             </section>
           )}
           
           <div className="rounded-xl bg-foreground p-5 text-background shadow-xl">
              <Info size={18} className="opacity-50 mb-4" />
              <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">Intelligence source verified via {intelligence.source} regional protocols.</p>
           </div>
        </div>
      ) : (
        <div className="py-20 text-center">
           <div className="relative mx-auto mb-6 size-12">
              <Loader2 size={48} className={cn("text-muted opacity-20", isPending && "animate-spin opacity-100")} />
              {!isPending && <Info size={24} className="absolute inset-0 m-auto text-muted" />}
           </div>
           <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
             {isPending ? "Parsing sector intelligence..." : "No local intelligence detected"}
           </p>
           <button 
             onClick={onRefreshPlaces}
             disabled={isPending}
             className="mt-6 inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-6 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-surface-2 transition-all disabled:opacity-50"
           >
              {isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Scan Sector
           </button>
        </div>
      )}
    </div>
  );
}

function IntelSection({ icon: Icon, title, content }: { icon: LucideIcon, title: string, content: string | null }) {
  if (!content) return null;
  return (
    <section>
       <div className="flex items-center gap-3 mb-4 text-[10px] font-black uppercase tracking-widest text-muted">
          <Icon size={14} className="text-foreground" />
          {title}
       </div>
       <p className="text-sm font-medium leading-relaxed text-muted-2 uppercase tracking-wide">{content}</p>
    </section>
  );
}
