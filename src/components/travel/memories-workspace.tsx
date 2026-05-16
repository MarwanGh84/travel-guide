"use client";

import { useState } from "react";
import { Heart, PlusCircle, Bookmark, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { addMemory } from "@/app/actions";

type MemoryShape = {
  id: string;
  title: string;
  rating: number | null;
  favoriteMoments: string | null;
  notes: string | null;
  photosPlaceholder: string | null;
};

type MemoriesWorkspaceProps = {
  memories: MemoryShape[];
  tripName: string;
};

export function MemoriesWorkspace({ memories, tripName }: MemoriesWorkspaceProps) {
  const [selectedId, setSelectedId] = useState(memories[0]?.id ?? "");
  const [createMode, setCreateMode] = useState(false);
  const resolvedSelectedId = memories.some((memory) => memory.id === selectedId) ? selectedId : memories[0]?.id ?? "";
  const active = memories.find((memory) => memory.id === resolvedSelectedId);

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* 1. Sidebar - Timeline of Memories */}
      <aside className="flex w-[320px] shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
           <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Archive</span>
           <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-muted">{memories.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/50">
           {memories.map((m) => (
             <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={cn(
                  "flex w-full flex-col gap-1 p-4 text-left transition-all",
                  resolvedSelectedId === m.id ? "bg-background ring-1 ring-inset ring-border" : "hover:bg-background/50"
                )}
             >
                <div className="flex items-center justify-between">
                   <h4 className={cn("truncate text-xs font-bold uppercase tracking-tight", resolvedSelectedId === m.id ? "text-foreground" : "text-muted-2")}>
                      {m.title}
                   </h4>
                   <span className="text-[10px] font-bold text-black">{m.rating}/5</span>
                </div>
                <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted">{tripName}</p>
             </button>
           ))}
           {memories.length === 0 && (
             <div className="p-12 text-center opacity-40">
                <Bookmark size={32} className="mx-auto mb-4" strokeWidth={1} />
                <p className="text-[10px] font-bold uppercase tracking-widest">No entries recorded</p>
             </div>
           )}
        </div>

        <div className="p-4 border-t border-border bg-background">
           <button
             onClick={() => {
               setCreateMode(true);
               setSelectedId("");
             }}
             className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-black text-[10px] font-black uppercase tracking-widest text-white hover:bg-zinc-800 transition-all"
           >
              <PlusCircle size={14} /> New Journal Entry
           </button>
        </div>
      </aside>

      {/* 2. Main Detail Stage */}
      <main className="relative flex-1 overflow-y-auto bg-background p-12 lg:p-24">
        <AnimatePresence mode="wait">
          {createMode ? (
            <motion.form
              action={async (formData) => {
                await addMemory(formData);
                setCreateMode(false);
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mx-auto grid max-w-2xl gap-4"
            >
              <input name="title" required placeholder="Entry title" className="h-10 rounded-md border border-border bg-surface px-3 text-sm" />
              <input name="rating" type="number" min="0" max="5" placeholder="Rating out of 5" className="h-10 rounded-md border border-border bg-surface px-3 text-sm" />
              <textarea name="favoriteMoments" placeholder="Favorite moments" className="min-h-24 rounded-md border border-border bg-surface p-3 text-sm" />
              <textarea name="placesVisited" placeholder="Places visited" className="min-h-20 rounded-md border border-border bg-surface p-3 text-sm" />
              <textarea name="favoriteRestaurants" placeholder="Favorite restaurants" className="min-h-20 rounded-md border border-border bg-surface p-3 text-sm" />
              <textarea name="favoriteHiddenGems" placeholder="Favorite hidden gems" className="min-h-20 rounded-md border border-border bg-surface p-3 text-sm" />
              <textarea name="placesToRevisit" placeholder="Places to revisit" className="min-h-20 rounded-md border border-border bg-surface p-3 text-sm" />
              <textarea name="nextTime" placeholder="What to do differently next time" className="min-h-20 rounded-md border border-border bg-surface p-3 text-sm" />
              <textarea name="notes" placeholder="Notes" className="min-h-24 rounded-md border border-border bg-surface p-3 text-sm" />
              <input name="photosPlaceholder" placeholder="Photo URL" className="h-10 rounded-md border border-border bg-surface px-3 text-sm" />
              <input name="photo" type="file" className="h-10 rounded-md border border-border bg-surface px-3 text-sm" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setCreateMode(false)} className="h-10 rounded-md border border-border px-4 text-[10px] font-bold uppercase tracking-widest text-muted">Cancel</button>
                <button type="submit" className="h-10 rounded-md bg-black px-4 text-[10px] font-bold uppercase tracking-widest text-white">Save Entry</button>
              </div>
            </motion.form>
          ) : active ? (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-2xl"
            >
               <header className="mb-12 border-b border-border pb-12">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="flex gap-0.5 text-black">
                        {[...Array(5)].map((_, i) => (
                          <Heart key={i} size={10} fill={(active.rating ?? 0) > i ? "currentColor" : "none"} className={(active.rating ?? 0) > i ? "" : "text-muted"} />
                        ))}
                     </div>
                     <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{tripName} PERSPECTIVE</span>
                  </div>
                  <h1 className="text-5xl font-black uppercase tracking-tighter text-foreground">{active.title}</h1>
               </header>

               <div className="space-y-16">
                  {/* Photo Section */}
                  {active.photosPlaceholder && (
                    <section className="relative aspect-video overflow-hidden rounded-2xl border border-border shadow-sm">
                       <img src={active.photosPlaceholder} alt="" className="h-full w-full object-cover" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </section>
                  )}

                  {/* Highlights */}
                  <section className="space-y-6">
                     <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                        <MessageSquare size={12} className="text-black" />
                        <span>Core Reflections</span>
                     </div>
                     <div className="space-y-8">
                        <div>
                           <h3 className="text-[10px] font-bold uppercase text-muted mb-2">Favorite Moments</h3>
                           <p className="text-lg font-medium leading-relaxed text-foreground">{active.favoriteMoments}</p>
                        </div>
                        <div>
                           <h3 className="text-[10px] font-bold uppercase text-muted mb-2">Internal Memo</h3>
                           <p className="text-base leading-relaxed text-muted-2 italic">{active.notes}</p>
                        </div>
                     </div>
                  </section>
               </div>

               <footer className="mt-12 border-t border-border pt-8">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                     Journal entries are currently append-only.
                  </p>
               </footer>
            </motion.div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
               <Bookmark size={48} strokeWidth={1} />
               <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em]">Select an entry to view the archive</p>
            </div>
          )}
        </AnimatePresence>

        {/* Global Footer rail */}
        <footer className="sticky bottom-0 flex h-12 items-center justify-between border-t border-border bg-surface px-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted">
           <div className="flex items-center gap-6">
              <span className="flex items-center gap-2"><Heart size={12} /> Local Storage Valid</span>
              <span className="text-foreground">USER: @marwanghostine</span>
           </div>
           <span>Design Intelligence: v2.0.4</span>
        </footer>
      </main>
    </div>
  );
}
