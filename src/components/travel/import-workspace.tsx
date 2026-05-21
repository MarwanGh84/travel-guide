"use client";

import { useEffect, useMemo, useState } from "react";
import { 
  Check, 
  Download, 
  Mail, 
  Save, 
  Search, 
  ShieldCheck,
  Zap,
  PlusCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input, Textarea } from "@/components/ui/input";
import type { ParsedTravelEmail } from "@/lib/imports/travelEmailParser";

type GmailStatus = {
  connected: boolean;
  email?: string | null;
  configured: boolean;
  message: string;
};

export function ImportWorkspace() {
  const [activeTab, setActiveTab] = useState<"gmail" | "manual">("gmail");
  const [manualBody, setManualBody] = useState("");
  const [gmailQuery, setGmailQuery] = useState("from:(booking.com OR expedia) newer_than:365d");
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [imports, setImports] = useState<ParsedTravelEmail[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/imports/preview")
      .then((response) => response.json())
      .then((nextStatus: GmailStatus) => setStatus(nextStatus))
      .catch(() => setStatus({ connected: false, configured: false, message: "Could not read Gmail connection status." }));
  }, []);

  const importRows = useMemo(() => buildImportRows(imports), [imports]);
  const activeRow = importRows.find((row) => row.uiKey === selectedId) ?? importRows[0];
  const activeImport = activeRow?.item;
  const selectedImports = useMemo(
    () => importRows.filter((row) => selected.has(row.uiKey)).map((row) => row.item),
    [importRows, selected],
  );

  async function runImport(makeRequest: () => Promise<Response>) {
    setLoading(true);
    setMessage("Reading confirmations...");
    const response = await makeRequest();
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(result.message ?? "Import failed.");
      return;
    }
    const parsed: ParsedTravelEmail[] = result.data ?? [];
    const nextRows = buildImportRows(parsed);
    setImports(parsed);
    setSelected(new Set(nextRows.filter((row) => row.item.autoSelect).map((row) => row.uiKey)));
    setSelectedId(nextRows[0]?.uiKey ?? "");
    setMessage(parsed.length ? `${parsed.length} records ready.` : "No travel records found.");
  }

  async function saveSelected() {
    setLoading(true);
    setMessage("Saving selected records...");
    const response = await fetch("/api/imports/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imports: selectedImports }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(result.message ?? "Could not save imports.");
      return;
    }
    setMessage(`Saved ${result.count ?? 0} imports${result.skipped ? `; skipped ${result.skipped} duplicate${result.skipped === 1 ? "" : "s"}` : ""}.`);
    setImports([]);
    setSelected(new Set());
  }

  function toggle(key: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-background flex-col lg:flex-row">
      {/* 1. Sidebar - Config & Source List */}
      <aside className="flex w-full shrink-0 flex-col border-b border-border bg-surface lg:w-[350px] lg:border-b-0 lg:border-r">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
           <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Import Pipeline</span>
           <div className="flex gap-2">
              <button onClick={() => setActiveTab("gmail")} className={cn("text-[9px] font-bold uppercase", activeTab === "gmail" ? "text-foreground" : "text-muted")}>Gmail</button>
              <button onClick={() => setActiveTab("manual")} className={cn("text-[9px] font-bold uppercase", activeTab === "manual" ? "text-foreground" : "text-muted")}>Paste</button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto">
           {/* Connection Config */}
           <div className="p-4 space-y-6">
              {activeTab === "gmail" ? (
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted">Gmail Scan</span>
                      {status?.connected ? <span className="text-[9px] font-bold text-emerald-600">CONNECTED</span> : <span className="text-[9px] font-bold text-muted">STANDBY</span>}
                   </div>
                   <Input 
                      value={gmailQuery} 
                      onChange={(e) => setGmailQuery(e.target.value)}
                      className="h-8 bg-background border-border text-[11px]" 
                      placeholder="Gmail search query..."
                   />
                   <button 
                      onClick={() => runImport(() => fetch("/api/imports/gmail", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ query: gmailQuery, maxResults: 8 }),
                      }))}
                      disabled={loading || !status?.connected}
                      className="flex h-8 w-full items-center justify-center gap-2 rounded-md bg-foreground text-[10px] font-bold uppercase tracking-widest text-background hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-30"
                   >
                      <Search size={12} /> Scan Inboxes
                   </button>
                </div>
              ) : (
                <div className="space-y-4">
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted">Manual Paste</span>
                   <Textarea 
                      value={manualBody} 
                      onChange={(e) => setManualBody(e.target.value)}
                      className="min-h-[120px] bg-background border-border text-[11px]" 
                      placeholder="Paste email raw text here..."
                   />
                   <button 
                      onClick={() => runImport(() => fetch("/api/imports/preview", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ body: manualBody }),
                      }))}
                      disabled={loading || !manualBody.trim()}
                      className="flex h-8 w-full items-center justify-center gap-2 rounded-md bg-foreground text-[10px] font-bold uppercase tracking-widest text-background hover:bg-zinc-800 dark:hover:bg-zinc-200"
                   >
                      <Download size={12} /> Parse Text
                   </button>
                </div>
              )}
           </div>

           <div className="h-px bg-border" />

           {/* Results List */}
           <div className="divide-y divide-border/50">
              {importRows.map(({ item, uiKey }) => {
                const key = uiKey;
                const isActive = selectedId === key;
                const isSelected = selected.has(key);
                return (
                  <button
                     key={key}
                     onClick={() => setSelectedId(key)}
                     className={cn(
                       "flex w-full items-center gap-3 p-4 text-left transition-all",
                       isActive ? "bg-background ring-1 ring-inset ring-border" : "hover:bg-background/50"
                     )}
                  >
                     <div className="relative size-10 shrink-0">
                        <div className="size-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-muted">
                           <Mail size={16} />
                        </div>
                        {isSelected && (
                          <div className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-foreground text-[8px] font-black text-background shadow-lg">
                             <Check size={8} strokeWidth={4} />
                          </div>
                        )}
                     </div>
                     <div className="min-w-0 flex-1">
                        <h4 className={cn("truncate text-[11px] font-bold uppercase tracking-tight", isActive ? "text-foreground" : "text-muted-2")}>
                           {item.title}
                        </h4>
                        <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted mt-0.5">
                          {item.provider} · {item.bookingType}
                        </p>
                        <p className={cn(
                          "mt-1 truncate text-[9px] font-black uppercase tracking-widest",
                          item.confidenceLabel === "high-confidence"
                            ? "text-emerald-600"
                            : item.confidenceLabel === "possible"
                              ? "text-amber-600"
                              : "text-rose-600",
                        )}>
                          {confidenceLabel(item.confidenceLabel)}
                        </p>
                     </div>
                  </button>
                );
              })}
              {imports.length === 0 && !loading && (
                <div className="py-20 text-center opacity-40">
                   <Zap size={32} className="mx-auto mb-4 text-muted" strokeWidth={1} />
                   <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Ready for Import</p>
                </div>
              )}
           </div>
        </div>

        <div className="p-4 border-t border-border bg-background">
           <button 
              onClick={saveSelected}
              disabled={loading || selectedImports.length === 0}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-lg bg-foreground text-[10px] font-black uppercase tracking-widest text-background shadow-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-30 transition-all"
           >
              <Save size={14} /> Commit {selectedImports.length} Records
           </button>
        </div>
      </aside>

      {/* 2. Detail & Review Stage */}
      <main className="relative flex-1 overflow-y-auto bg-background p-6 lg:p-12 xl:p-24">
        <AnimatePresence mode="wait">
          {activeImport ? (
            <motion.div
              key={selectedId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-2xl"
            >
               <header className="mb-12 border-b border-border pb-12">
                  <div className="flex items-center justify-between gap-8">
                     <div className="min-w-0">
                        <div className="flex items-center gap-4 mb-4">
                           <span className="rounded-full bg-surface-2 px-3 py-1 text-[9px] font-black uppercase tracking-widest border border-border">
                              {activeImport.bookingType}
                           </span>
                           <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{activeImport.provider} SOURCE</span>
                           <span className={cn(
                             "rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border",
                             activeImport.confidenceLabel === "high-confidence"
                               ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                               : activeImport.confidenceLabel === "possible"
                                 ? "border-amber-200 bg-amber-50 text-amber-700"
                                 : "border-rose-200 bg-rose-50 text-rose-700",
                           )}>
                             {confidenceLabel(activeImport.confidenceLabel)}
                           </span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter text-foreground leading-none">{activeImport.title}</h1>
                     </div>
                     <button 
                        onClick={() => toggle(activeRow.uiKey)}
                        disabled={activeImport.confidenceLabel === "rejected"}
                        className={cn(
                          "grid size-12 shrink-0 place-items-center rounded-xl border transition-all shadow-sm",
                          selected.has(selectedId) ? "bg-foreground text-background border-foreground" : "bg-background text-muted border-border hover:border-foreground hover:text-foreground",
                          activeImport.confidenceLabel === "rejected" && "cursor-not-allowed opacity-40 hover:border-border hover:text-muted",
                        )}
                     >
                        {selected.has(selectedId) ? <Check size={20} strokeWidth={3} /> : <PlusCircle size={20} strokeWidth={3} />}
                     </button>
                  </div>
               </header>

               <div className="space-y-16">
                  {/* Extracted Data Grid */}
                  <div className="grid gap-12 sm:grid-cols-2">
                     <section>
                        <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Core Extraction</h3>
                        <div className="space-y-4">
                           <ExtractedField label="CONFIRMATION #" value={activeImport.confirmationNumber || "NOT DETECTED"} />
                           <ExtractedField label="SCHEDULE" value={`${activeImport.startDate || "PENDING"} — ${activeImport.endDate || "N/A"}`} />
                           <ExtractedField label="FINANCIALS" value={activeImport.price || "CALCULATING"} />
                        </div>
                     </section>
                     <section>
                        <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Context Intelligence</h3>
                        <div className="space-y-4">
                           <ExtractedField label="GUEST ENTITY" value={activeImport.guestName || "GENERAL"} />
                           <ExtractedField label="LOCATION" value={activeImport.address || "PENDING RESOLUTION"} />
                        </div>
                     </section>
                  </div>

                  {/* Raw Intelligence Snippet */}
                  <section>
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Analysis Snippet</h3>
                        <div className="flex items-center gap-2">
                           <div className="h-1 w-24 rounded-full bg-surface-2 overflow-hidden border border-border">
                              <div className="h-full bg-emerald-500" style={{ width: `${activeImport.confidenceScore}%` }} />
                           </div>
                           <span className="text-[9px] font-black text-emerald-600">{activeImport.confidenceScore}% CONFIDENCE</span>
                        </div>
                     </div>
                     {activeImport.confidenceLabel === "rejected" && activeImport.rejectionReasons.length > 0 && (
                       <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-rose-600">
                         Ignored: {activeImport.rejectionReasons.join(", ")}
                       </p>
                     )}
                     <div className="rounded-xl border border-border bg-surface p-8 shadow-inner">
                        <p className="text-sm font-medium leading-relaxed text-muted-2 italic">
                           &quot;{activeImport.rawSnippet}...&quot;
                        </p>
                     </div>
                  </section>
               </div>
            </motion.div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
               <ShieldCheck size={48} strokeWidth={1} />
               <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em]">Select a parsed record to review extraction details</p>
            </div>
          )}
        </AnimatePresence>

        {/* Global Footer Status */}
        <footer className="sticky bottom-0 flex h-10 items-center justify-between border-t border-border bg-surface px-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted">
           <div className="flex items-center gap-6">
              <span className="hidden sm:flex items-center gap-2"><ShieldCheck size={12} /> Sync Status: {loading ? "WORKING" : "IDLE"}</span>
              <span className="text-foreground truncate max-w-[200px] sm:max-w-none">{message || "Awaiting scan protocol..."}</span>
           </div>
           <span className="hidden sm:inline">System Load: Optimized</span>
        </footer>
      </main>
    </div>
  );
}

function ExtractedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/50 pb-2">
       <span className="text-[8px] font-black tracking-widest text-muted">{label}</span>
       <span className="text-xs font-bold uppercase tracking-tight text-foreground truncate">{value}</span>
    </div>
  );
}

function importKey(item: ParsedTravelEmail) {
  return `${item.provider}-${item.bookingType}-${item.title}-${item.confirmationNumber ?? ""}-${item.importFingerprint}`;
}

function buildImportRows(items: ParsedTravelEmail[]) {
  const occurrences = new Map<string, number>();

  return items.map((item) => {
    const baseKey = importKey(item);
    const occurrence = occurrences.get(baseKey) ?? 0;
    occurrences.set(baseKey, occurrence + 1);

    return {
      item,
      uiKey: `${baseKey}::${occurrence}`,
    };
  });
}

function confidenceLabel(value: ParsedTravelEmail["confidenceLabel"]) {
  switch (value) {
    case "high-confidence":
      return "High confidence travel booking";
    case "possible":
      return "Possible travel-related";
    case "rejected":
      return "Rejected / ignored";
  }
}
