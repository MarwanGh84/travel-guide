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
import { useRouter } from "next/navigation";
import Image from "next/image";

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
  const router = useRouter();
  const [selectedNoteId, setSelectedNoteId] = useState(notes[0]?.id ?? "");
  const [createMode, setCreateMode] = useState(false);
  const resolvedSelectedNoteId = notes.some((note) => note.id === selectedNoteId) ? selectedNoteId : notes[0]?.id ?? "";
  const activeNote = notes.find((note) => note.id === resolvedSelectedNoteId);

  return (
    <div className="flex h-full w-full overflow-hidden flex-col lg:flex-row bg-background">
      {/* 1. Sidebar - List of Documents */}
      <aside className={cn(
        "flex w-full shrink-0 flex-col border-b border-border bg-surface lg:w-[350px] lg:border-b-0 lg:border-r transition-all duration-300",
        (activeNote || createMode) ? "h-[120px] lg:h-full" : "h-full"
      )}>
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
             className="grid size-7 place-items-center rounded-md bg-black text-white hover:bg-zinc-800 transition-all"
           >
              <PlusCircle size={14} />
           </button>
        </div>

        <div className="flex gap-3 overflow-x-auto p-4 lg:flex-1 lg:flex-col lg:overflow-x-visible lg:p-0 lg:divide-y lg:divide-border/50 no-scrollbar">
           {notes.map((note) => (
             <button
                key={note.id}
                onClick={() => {
                  setCreateMode(false);
                  setSelectedNoteId(note.id);
                }}
                className={cn(
                  "shrink-0 w-[240px] flex flex-col gap-1 p-3 rounded-xl border transition-all lg:w-full lg:rounded-none lg:border-none lg:p-4 lg:text-left",
                  resolvedSelectedNoteId === note.id 
                    ? "bg-background border-black shadow-sm lg:ring-1 lg:ring-inset lg:ring-border" 
                    : "bg-background/50 border-border lg:hover:bg-background/50"
                )}
             >
                <div className="flex items-center justify-between gap-2">
                   <h4 className={cn("truncate text-xs font-bold uppercase tracking-tight", resolvedSelectedNoteId === note.id ? "text-foreground" : "text-muted-2")}>
                      {note.title}
                   </h4>
                   {note.importGroupId && <div className="size-1.5 shrink-0 rounded-full bg-emerald-500" />}
                </div>
                <p className="truncate text-[9px] font-bold uppercase tracking-widest text-muted">
                  {note.type}{note.importGroupId ? " · GMAIL" : ""}
                </p>
             </button>
           ))}
           {notes.length === 0 && (
             <div className="p-8 text-center opacity-40 w-full">
                <FileText size={24} className="mx-auto mb-3" strokeWidth={1} />
                <p className="text-[10px] font-bold uppercase tracking-widest">Empty Archive</p>
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
                   router.refresh();
                 }}
                 className="flex-1 flex flex-col overflow-hidden"
               >
               {!createMode && activeNote && <input type="hidden" name="documentNoteId" value={activeNote.id} />}
               <header className="flex h-auto shrink-0 flex-col gap-3 border-b border-border bg-surface px-6 py-3 sm:h-12 sm:flex-row sm:items-center sm:justify-between sm:py-0">
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted">
                     <span className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> {createMode ? "New" : "Active"}</span>
                     <div className="hidden h-4 w-px bg-border sm:block" />
                     <input name="type" defaultValue={activeNote?.type ?? "Journal note"} className="h-7 w-28 rounded-md border border-border bg-background px-2 text-[10px] font-bold uppercase tracking-widest text-muted sm:w-auto" />
                  </div>
                  <div className="flex items-center gap-2">
                     {!createMode && activeNote && (
                        <button
                          formAction={deleteDocumentNote}
                          className="flex h-8 flex-1 items-center justify-center gap-2 rounded-md px-3 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-rose-600 transition-all sm:flex-none"
                        >
                           <Trash2 size={12} /> <span className="hidden xs:inline">Remove</span>
                        </button>
                     )}
                     <button type="submit" className="flex h-8 flex-1 items-center justify-center gap-2 rounded-md bg-black px-4 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-zinc-800 transition-all sm:flex-none">
                        <Save size={12} /> {createMode ? "Create" : "Update"}
                     </button>
                  </div>
               </header>

               {/* Editor Stage */}
               <div className="flex-1 overflow-y-auto p-6 sm:p-12 lg:p-24 scrollbar-hide pb-20">
                  <div className="mx-auto max-w-2xl space-y-10 sm:space-y-12">
                     <header>
                        <Input
                           name="title"
                           defaultValue={activeNote?.title ?? ""}
                           className="h-auto border-none bg-transparent p-0 text-3xl sm:text-5xl font-black uppercase tracking-tighter focus:ring-0" 
                           placeholder="Untitled Note"
                        />
                     </header>

                     <section className="space-y-6">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                           <span>Reference Intel</span>
                           {activeNote?.link && isExternalLink(activeNote.link) && (
                             <a href={activeNote.link} target="_blank" className="flex items-center gap-2 text-foreground hover:underline">
                                Official Link <ExternalLink size={10} />
                             </a>
                           )}
                        </div>
                        {activeNote?.link && isUploadedFile(activeNote.link) && (
                          <AttachmentPreview href={activeNote.link} />
                        )}
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-[10px] font-medium text-amber-900 uppercase tracking-widest">
                          Local storage active · Not encrypted
                        </div>
                        <Input name="link" defaultValue={activeNote?.link ?? ""} placeholder="Optional reference URL" className="h-10 bg-surface text-sm sm:h-9" />
                        <Input name="file" type="file" className="h-10 bg-surface text-sm sm:h-9 pt-2" />
                        <Textarea 
                           name="content"
                           defaultValue={activeNote?.content ?? ""}
                           className="min-h-[300px] sm:min-h-[400px] border-none bg-surface p-6 sm:p-8 text-base leading-relaxed text-muted-2 focus:ring-1 focus:ring-border rounded-xl shadow-inner"
                           placeholder="Detailed notes and observations..."
                        />
                     </section>
                  </div>
               </div>
               </form>
            </motion.div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-40 px-6">
               <FileText size={48} strokeWidth={1} />
               <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em]">Select a record to review</p>
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

function isUploadedFile(link: string) {
  return link.startsWith("/uploads/travel/");
}

function isExternalLink(link: string) {
  return /^https?:\/\//i.test(link);
}

function AttachmentPreview({ href }: { href: string }) {
  const fileName = href.split("/").pop() ?? "uploaded-file";
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  const displayExtension = extension.toUpperCase() || "FILE";
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "avif"].includes(extension);
  const isPdf = extension === "pdf";

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted">Uploaded attachment</p>
          <p className="mt-1 truncate text-sm font-bold text-foreground">{fileName}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted">{displayExtension}</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={href} download className="rounded-md bg-black px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-zinc-800">
            Download
          </a>
        </div>
      </div>
      {isImage && (
        <div className="relative h-[420px] overflow-hidden rounded-lg border border-border bg-background">
          <Image
            src={href}
            alt={fileName}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-contain"
          />
        </div>
      )}
      {isPdf && (
        <iframe
          src={href}
          title={fileName}
          className="h-[420px] w-full rounded-lg border border-border bg-background"
        />
      )}
      {!isImage && !isPdf && (
        <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted">
          Inline preview is not available for this file type. Download it to inspect the attachment.
        </div>
      )}
    </div>
  );
}
