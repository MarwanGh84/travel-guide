"use client";

import { useState } from "react";
import { 
  FileText, 
  Save, 
  Trash2,
  PlusCircle,
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { addDocumentNote, deleteDocumentNote, updateDocumentNote } from "@/app/actions";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input, Textarea } from "@/components/ui/input";

type DocumentNote = {
  id: string;
  title: string;
  type: string;
  content: string;
  link?: string | null;
  importGroupId?: string | null;
};

type DocumentsWorkspaceProps = {
  notes: DocumentNote[];
  tripName: string;
};

export function DocumentsWorkspace({ notes, tripName }: DocumentsWorkspaceProps) {
  const [selectedNoteId, setSelectedNoteId] = useState(notes[0]?.id ?? "");
  const [createMode, setCreateMode] = useState(false);
  const resolvedSelectedNoteId = notes.some((note) => note.id === selectedNoteId) ? selectedNoteId : notes[0]?.id ?? "";
  const activeNote = notes.find((note) => note.id === resolvedSelectedNoteId);

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* 1. Sidebar - List of Documents */}
      <aside className="flex w-[350px] shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
           <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Travel Notes</span>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-muted">{notes.length}</span>
           </div>
           <button
             onClick={() => {
               setCreateMode(true);
               setSelectedNoteId("");
             }}
             className="grid size-7 place-items-center rounded-md hover:bg-surface-2 transition-colors"
           >
              <PlusCircle size={14} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/50">
           {notes.map((note) => (
             <button
                key={note.id}
                onClick={() => {
                  setCreateMode(false);
                  setSelectedNoteId(note.id);
                }}
                className={cn(
                  "flex w-full flex-col gap-1 p-4 text-left transition-all",
                  resolvedSelectedNoteId === note.id ? "bg-background ring-1 ring-inset ring-border" : "hover:bg-background/50"
                )}
             >
                <div className="flex items-center justify-between">
                   <h4 className={cn("truncate text-xs font-bold uppercase tracking-tight", resolvedSelectedNoteId === note.id ? "text-foreground" : "text-muted-2")}>
                      {note.title}
                   </h4>
                   {note.importGroupId && <div className="size-1.5 rounded-full bg-emerald-500" />}
                </div>
                <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted">{note.type}</p>
             </button>
           ))}
           {notes.length === 0 && (
             <div className="p-12 text-center opacity-40">
                <FileText size={32} className="mx-auto mb-4" strokeWidth={1} />
                <p className="text-[10px] font-bold uppercase tracking-widest">No notes found</p>
             </div>
           )}
        </div>
      </aside>

      {/* 2. Detail Stage */}
      <main className="relative flex-1 overflow-hidden flex flex-col bg-background">
        <AnimatePresence mode="wait">
          {activeNote || createMode ? (
            <motion.div
              key={createMode ? "new-note" : activeNote?.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
               {/* Document Toolbar */}
               <form
                 action={async (formData) => {
                   if (createMode) {
                     await addDocumentNote(formData);
                     setCreateMode(false);
                   } else {
                     await updateDocumentNote(formData);
                   }
                 }}
                 className="flex-1 flex flex-col overflow-hidden"
               >
               {!createMode && activeNote && <input type="hidden" name="documentNoteId" value={activeNote.id} />}
               <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-6 bg-surface">
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted">
                     <span className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> {createMode ? "New" : "Active"}</span>
                     <div className="h-4 w-px bg-border" />
                     <input name="type" defaultValue={activeNote?.type ?? "Journal note"} className="h-7 rounded-md border border-border bg-background px-2 text-[10px] font-bold uppercase tracking-widest text-muted" />
                  </div>
                  <div className="flex items-center gap-2">
                     {!createMode && activeNote && (
                        <button
                          formAction={deleteDocumentNote}
                          className="flex h-8 items-center gap-2 rounded-md px-3 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-rose-600 transition-all"
                        >
                           <Trash2 size={12} /> Remove
                        </button>
                     )}
                     <button type="submit" className="flex h-8 items-center gap-2 rounded-md bg-black px-4 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-zinc-800 transition-all">
                        <Save size={12} /> {createMode ? "Create" : "Update"}
                     </button>
                  </div>
               </header>

               {/* Editor Stage */}
               <div className="flex-1 overflow-y-auto p-12 lg:p-24">
                  <div className="mx-auto max-w-2xl space-y-12">
                     <header>
                        <Input
                           name="title"
                           defaultValue={activeNote?.title ?? ""}
                           className="h-auto border-none bg-transparent p-0 text-5xl font-black uppercase tracking-tighter focus:ring-0" 
                           placeholder="Untitled note"
                        />
                     </header>

                     <section className="space-y-6">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                           <span>Refrence Content</span>
                           {activeNote?.link && (
                             <a href={activeNote.link} target="_blank" className="flex items-center gap-2 text-foreground hover:underline">
                                Official Link <ExternalLink size={10} />
                             </a>
                           )}
                        </div>
                        <Input name="link" defaultValue={activeNote?.link ?? ""} placeholder="Reference link" className="h-9 bg-surface" />
                        <Input name="file" type="file" className="h-9 bg-surface" />
                        <Textarea 
                           name="content"
                           defaultValue={activeNote?.content ?? ""}
                           className="min-h-[400px] border-none bg-surface p-8 text-base leading-relaxed text-muted-2 focus:ring-1 focus:ring-border rounded-xl shadow-inner"
                           placeholder="Add detailed notes or references here..."
                        />
                     </section>
                  </div>
               </div>
               </form>
            </motion.div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
               <FileText size={48} strokeWidth={1} />
               <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em]">Select a record to view your travel notes</p>
            </div>
          )}
        </AnimatePresence>

        {/* Global Footer Status */}
        <footer className="flex h-10 shrink-0 items-center justify-between border-t border-border bg-surface px-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted">
           <div className="flex items-center gap-6">
              <span className="flex items-center gap-2"><CheckCircle2 size={12} /> Local Storage Active</span>
              <span className="text-foreground">TRIP: {tripName}</span>
           </div>
           <span>Last Sync: Current Session</span>
        </footer>
      </main>
    </div>
  );
}
