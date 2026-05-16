"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  WandSparkles, 
  ShieldCheck,
  Target,
  Trash2
} from "lucide-react";
import { createTrip, deleteTrip } from "@/app/actions";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const interests = ["food", "beaches", "nature", "museums", "shopping", "nightlife", "history", "photography", "hidden gems"];
const steps = ["Identity", "Timing", "Style", "Interests", "Review"];

export default function TripsPage() {
  const [step, setStep] = useState(0);
  const [destinationMode, setDestinationMode] = useState<"known" | "recommend">("known");

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* 1. Step Rail */}
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-border bg-surface p-6">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Configuration</span>
        <h2 className="mt-2 text-xl font-bold tracking-tight">New Journey</h2>
        
        <nav className="mt-8 flex-1 space-y-1">
           {steps.map((s, i) => (
             <div 
                key={s} 
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-bold transition-all",
                  i === step ? "bg-black text-white shadow-lg translate-x-2" : i < step ? "text-emerald-600" : "text-muted"
                )}
             >
                <span className="grid size-4 place-items-center rounded-full border border-current text-[8px]">
                   {i < step ? <CheckCircle2 size={10} /> : i + 1}
                </span>
                {s.toUpperCase()}
             </div>
           ))}
        </nav>

        <div className="mt-auto space-y-4">
           <div className="rounded-xl bg-black p-5 text-white shadow-2xl">
              <Target size={20} className="text-muted opacity-50" />
              <p className="mt-4 text-[10px] font-black uppercase tracking-widest leading-relaxed opacity-80">
                 Our AI engine will analyze this brief to generate a curated discovery stack and optimized timeline.
              </p>
           </div>
           
           <form action={deleteTrip}>
              <button 
                type="submit"
                onClick={(e) => { if (!confirm("WARNING: This will permanently delete your active trip brief and all associated data.")) e.preventDefault(); }}
                className="w-full h-10 rounded-md border border-border bg-surface text-[9px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center justify-center gap-2"
              >
                 <Trash2 size={10} /> Terminate Brief
              </button>
           </form>
        </div>
      </aside>

      {/* 2. Main Config Workspace */}
      <main className="flex-1 overflow-y-auto">
        <form action={createTrip} className="mx-auto flex min-h-full max-w-2xl flex-col p-12 lg:p-24">
          <input type="hidden" name="destinationMode" value={destinationMode} />
          
          <div className="flex-1">
            <header className="mb-12">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">STEP 0{step + 1}</span>
               <h1 className="mt-2 text-5xl font-black tracking-tighter uppercase">{steps[step]}</h1>
            </header>

            <div className="space-y-10">
              {/* Step 0: Identity */}
              <div className={cn("space-y-8", step !== 0 && "hidden")}>
                <ConfigField label="TRIP NAME" description="Internal reference for your workspace.">
                   <Input name="name" placeholder="Summer break 2026" className="h-12 bg-surface font-bold uppercase tracking-wide border-border" />
                </ConfigField>
                <ConfigField label="DESTINATION STRATEGY">
                   <Select value={destinationMode} onChange={(event) => setDestinationMode(event.target.value as "known" | "recommend")} className="h-12 bg-surface font-bold uppercase tracking-wide border-border">
                      <option value="known">MANUAL ENTRY</option>
                      <option value="recommend">AI RECOMMENDATION</option>
                   </Select>
                </ConfigField>
                <div className="grid gap-6 lg:grid-cols-2">
                   <ConfigField label="CITY">
                      <Input name="destination" disabled={destinationMode === "recommend"} className="h-12 bg-surface border-border font-bold uppercase" placeholder="e.g. Tokyo" />
                   </ConfigField>
                   <ConfigField label="COUNTRY">
                      <Input name="destinationCountry" className="h-12 bg-surface border-border font-bold uppercase" placeholder="e.g. Japan" />
                   </ConfigField>
                </div>
              </div>

              {/* Step 1: Timing */}
              <div className={cn("space-y-8", step !== 1 && "hidden")}>
                <ConfigField label="DEPARTURE ORIGIN">
                   <Input name="departureCity" className="h-12 bg-surface border-border font-bold uppercase" placeholder="NYC, London, etc." />
                </ConfigField>
                <div className="grid gap-6 lg:grid-cols-2">
                   <ConfigField label="START DATE">
                      <Input name="startDate" type="date" className="h-12 bg-surface border-border font-bold" />
                   </ConfigField>
                   <ConfigField label="END DATE">
                      <Input name="endDate" type="date" className="h-12 bg-surface border-border font-bold" />
                   </ConfigField>
                </div>
                <ConfigField label="TOTAL TRAVELERS">
                   <Input name="travelerCount" type="number" defaultValue={1} className="h-12 bg-surface border-border font-bold" />
                </ConfigField>
              </div>

              {/* Step 2: Style */}
              <div className={cn("space-y-8", step !== 2 && "hidden")}>
                <ConfigField label="GLOBAL CAPITAL POOL" description="Used to calibrate discovery and dining options.">
                   <Input name="budget" type="number" className="h-14 bg-surface border-border text-2xl font-black" placeholder="0.00" />
                </ConfigField>
                <div className="grid gap-6 lg:grid-cols-2">
                   <ConfigField label="TRAVEL STYLE">
                      <Select name="travelStyle" defaultValue="balanced" className="h-12 bg-surface border-border font-bold uppercase">
                         {["relaxed", "balanced", "adventure", "luxury", "family", "romantic", "cultural"].map((style) => <option key={style} value={style}>{style.toUpperCase()}</option>)}
                      </Select>
                   </ConfigField>
                   <ConfigField label="DAILY PACE">
                      <Select name="pace" defaultValue="medium" className="h-12 bg-surface border-border font-bold uppercase">
                         {["slow", "medium", "packed"].map((pace) => <option key={pace} value={pace}>{pace.toUpperCase()}</option>)}
                      </Select>
                   </ConfigField>
                </div>
              </div>

              {/* Step 3: Interests */}
              <div className={cn("space-y-10", step !== 3 && "hidden")}>
                <div className="flex flex-wrap gap-2">
                   {interests.map((interest) => (
                     <label key={interest} className="group flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all hover:border-black has-[:checked]:bg-black has-[:checked]:text-white shadow-sm">
                        <input name="interests" value={interest} type="checkbox" className="hidden" />
                        {interest}
                     </label>
                   ))}
                </div>
                <ConfigField label="INTERNAL MEMO" description="Add any specific requirements or notes for the AI planner.">
                   <Textarea name="notes" className="min-h-32 bg-surface border-border p-4 text-sm font-medium leading-relaxed" placeholder="e.g. Prioritize photography spots and local coffee culture..." />
                </ConfigField>
              </div>

              {/* Step 4: Review */}
              <div className={cn("space-y-6", step !== 4 && "hidden")}>
                <div className="rounded-2xl border-2 border-dashed border-border bg-surface p-12 text-center">
                   <ShieldCheck size={48} className="mx-auto text-emerald-500 mb-6" strokeWidth={1.5} />
                   <h3 className="text-xl font-bold uppercase tracking-tight">System Ready</h3>
                   <p className="mt-4 text-xs font-medium text-muted leading-relaxed max-w-sm mx-auto uppercase tracking-widest">
                      By clicking the button below, your journey brief will be initialized and the discovery engine will start processing local intelligence.
                   </p>
                   <button className="mt-10 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-black text-xs font-black uppercase tracking-[0.2em] text-white shadow-2xl hover:bg-zinc-800 transition-all">
                      <WandSparkles size={18} /> Initialize Journey
                   </button>
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-20 flex items-center justify-between border-t border-border pt-10">
            <button 
              type="button" 
              onClick={() => setStep((current) => Math.max(0, current - 1))} 
              disabled={step === 0} 
              className="flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-5 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-black disabled:opacity-30 transition-all"
            >
              <ArrowLeft size={12} /> BACK
            </button>
            
            {step < steps.length - 1 && (
              <button 
                type="button" 
                onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))} 
                className="flex h-10 items-center gap-2 rounded-md bg-black px-6 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg hover:bg-zinc-800 transition-all"
              >
                CONTINUE <ArrowRight size={12} />
              </button>
            )}
          </footer>
        </form>
      </main>
    </div>
  );
}

function ConfigField({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
       <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground">{label}</label>
          {description && <p className="text-[10px] font-medium text-muted uppercase tracking-wider">{description}</p>}
       </div>
       {children}
    </div>
  );
}
