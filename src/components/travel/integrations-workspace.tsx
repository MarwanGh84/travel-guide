"use client";

import { useState } from "react";
import { 
  CheckCircle2, 
  KeyRound, 
  PlugZap,
  ChevronRight,
  Settings,
  ShieldCheck,
  Zap,
  Globe,
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { IntegrationStatus } from "@/lib/api/integrationStatus";

type IntegrationsWorkspaceProps = {
  statuses: IntegrationStatus[];
};

export function IntegrationsWorkspace({ statuses }: IntegrationsWorkspaceProps) {
  const [selectedId, setSelectedId] = useState(statuses[0]?.id ?? "");

  const active = statuses.find(s => s.id === selectedId) ?? statuses[0];

  const categories = [
    { id: "apis", label: "Core APIs", icon: Zap, items: statuses.filter(s => ["openai", "google-places", "google-static-maps", "google-routes", "open-meteo", "frankfurter", "gmail"].includes(s.id)) },
    { id: "tools", label: "Travel Tools", icon: Globe, items: statuses.filter(s => ["booking", "expedia", "skyscanner", "getyourguide"].includes(s.id)) },
    { id: "infrastructure", label: "Systems", icon: Database, items: statuses.filter(s => !["openai", "google-places", "google-static-maps", "google-routes", "open-meteo", "frankfurter", "gmail", "booking", "expedia", "skyscanner", "getyourguide"].includes(s.id)) }
  ];

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* 1. Sidebar - Navigation & Hierarchy */}
      <aside className="flex w-[320px] shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
           <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Service Registry</span>
           <Settings size={14} className="text-muted" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
           {categories.map((cat) => (
             <section key={cat.id}>
                <h3 className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                   <cat.icon size={10} /> {cat.label}
                </h3>
                <div className="space-y-1">
                   {cat.items.map((s) => (
                     <button
                        key={s.id}
                        onClick={() => setSelectedId(s.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-all",
                          selectedId === s.id ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted hover:bg-background/50"
                        )}
                     >
                        <div className="flex items-center gap-3 truncate">
                           <StatusIndicator state={s.state} />
                           <span className="truncate">{s.name}</span>
                        </div>
                        <ChevronRight size={10} className={cn("transition-opacity", selectedId === s.id ? "opacity-100" : "opacity-0")} />
                     </button>
                   ))}
                </div>
             </section>
           ))}
        </div>
      </aside>

      {/* 2. Main Stage - Configuration & Health */}
      <main className="relative flex-1 overflow-y-auto bg-background p-12 lg:p-24">
        <AnimatePresence mode="wait">
          {active ? (
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
                     <span className={cn(
                       "rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest",
                       active.state === "live" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-surface-2 text-muted border border-border"
                     )}>
                        {active.state}
                     </span>
                     <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{active.category}</span>
                  </div>
                  <h1 className="text-5xl font-black uppercase tracking-tighter text-foreground">{active.name}</h1>
                  <p className="mt-6 text-lg font-medium leading-relaxed text-muted-2">{active.message}</p>
               </header>

               <div className="space-y-12">
                  {/* Environment Details */}
                  {active.env.length > 0 && (
                    <section>
                       <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Required Environment Keys</h3>
                       <div className="grid gap-3 lg:grid-cols-2">
                          {active.env.map((key) => (
                            <div key={key} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
                               <KeyRound size={14} className="text-muted" />
                               <span className="text-[10px] font-mono font-bold text-foreground">{key}</span>
                            </div>
                          ))}
                       </div>
                    </section>
                  )}

                  {/* Next Step Action */}
                  {active.nextStep && (
                    <section className="rounded-xl border border-border bg-surface p-8 shadow-inner">
                       <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Provisioning Protocol</h3>
                       <p className="text-sm font-medium leading-relaxed text-foreground">{active.nextStep}</p>
                    </section>
                  )}

                  {/* Security Policy */}
                  <section className="flex items-start gap-4 rounded-lg bg-emerald-50/50 p-4 border border-emerald-100">
                     <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Security Clearance</p>
                        <p className="mt-1 text-[10px] font-medium text-emerald-600/80 leading-relaxed uppercase tracking-wider">
                           All tokens and keys for {active.name} are stored in your local .env file. This workspace never transmits raw secrets over the network.
                        </p>
                     </div>
                  </section>
               </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Global Footer Rail */}
        <footer className="sticky bottom-0 flex h-12 items-center justify-between border-t border-border bg-surface px-6 text-[10px] font-black uppercase tracking-widest text-muted">
           <div className="flex items-center gap-6">
              <span className="flex items-center gap-2"><PlugZap size={12} /> Gateway Active</span>
              <span className="text-foreground">Total Services: {statuses.length}</span>
           </div>
           <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={12} /> Sync Healthy</span>
           </div>
        </footer>
      </main>
    </div>
  );
}

function StatusIndicator({ state }: { state: string }) {
  const colors = {
    live: "bg-emerald-500",
    failing: "bg-rose-500",
    ready: "bg-blue-500",
    mock: "bg-amber-500"
  };
  return <div className={cn("size-1.5 shrink-0 rounded-full", colors[state as keyof typeof colors] || "bg-border")} />;
}
