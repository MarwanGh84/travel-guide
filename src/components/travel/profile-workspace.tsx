"use client";

import { useState } from "react";
import { Save, Settings2, User, Wallet, Globe, FileText, CheckCircle2 } from "lucide-react";
import { saveProfile } from "@/app/actions";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type ProfileShape = {
  preferredHotelType?: string | null;
  travelPace?: string | null;
  foodPreferences?: string | null;
  budgetStyle?: string | null;
  favoriteActivities?: string | null;
  thingsToAvoid?: string | null;
  homeAirport?: string | null;
  passportNationality?: string | null;
  hiddenGemInterest?: boolean | null;
  preferredTravelMonths?: string | null;
  notes?: string | null;
} | null;

const tabs = [
  { id: "Preferences", label: "Preferences", icon: Globe },
  { id: "Financials", label: "Financials", icon: Wallet },
  { id: "Identity", label: "Identity", icon: User },
  { id: "Internal", label: "Archive", icon: FileText },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ProfileWorkspace({ profile }: { profile: ProfileShape }) {
  const [activeTab, setActiveTab] = useState<TabId>("Preferences");

  return (
    <div className="flex h-full w-full overflow-hidden flex-col lg:flex-row bg-background">
      {/* 1. Sidebar - Configuration Tabs */}
      <aside className="flex w-full shrink-0 flex-col border-b border-border bg-surface lg:w-[240px] lg:border-b-0 lg:border-r">
        <div className="hidden lg:flex p-4 border-b border-border bg-background">
           <span className="text-[10px] font-black uppercase tracking-widest text-muted">Configuration</span>
        </div>
        
        <nav className="flex gap-1 overflow-x-auto p-2 no-scrollbar scrollbar-hide lg:flex-1 lg:flex-col lg:overflow-x-visible lg:space-y-0.5">
           {tabs.map((tab) => (
             <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 shrink-0 rounded-md px-4 py-2 text-xs font-bold transition-all lg:w-full border-l-2 lg:py-2.5",
                  activeTab === tab.id 
                    ? "bg-background text-foreground shadow-sm border-foreground lg:ring-1 lg:ring-border" 
                    : "text-muted-foreground border-transparent hover:bg-surface-2/50"
                )}
             >
                <tab.icon size={14} className={activeTab === tab.id ? "text-foreground" : "text-muted-foreground"} />
                <span className="whitespace-nowrap">{tab.label}</span>
             </button>
           ))}
        </nav>

        <div className="hidden lg:block p-4 border-t border-border bg-background space-y-4">
           <div className="flex items-center gap-2 mb-2">
              <Settings2 size={12} className="text-muted" />
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Operational Logic</span>
           </div>
           <div className="space-y-3">
              <LogNode text="Airport drives discovery" />
              <LogNode text="Style shapes timeline" />
              <LogNode text="Archive guides AI studio" />
           </div>
        </div>
      </aside>

      {/* 2. Main Detail Stage */}
      <main className="relative flex-1 overflow-y-auto bg-background p-6 sm:p-12 lg:p-16 xl:p-20 scrollbar-hide">
        <form action={saveProfile} className="mx-auto max-w-2xl flex flex-col min-h-full">
           <header className="mb-8 border-b border-border pb-8 flex flex-col gap-4 sm:mb-12 sm:pb-12 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">System Settings</span>
                 <h1 className="mt-2 text-3xl sm:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">{activeTab}</h1>
              </div>
              <span className={cn(
                "w-fit rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border border-border",
                profile ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-surface-2 text-muted"
              )}>
                {profile ? "CONNECTED" : "UNINITIALIZED"}
              </span>
           </header>

           <div className="flex-1">
             <AnimatePresence mode="wait">
               <motion.div
                 key={activeTab}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2 }}
                 className="space-y-10 sm:space-y-12"
               >
                  {activeTab === "Preferences" && (
                    <div className="space-y-8 sm:space-y-10">
                       <div className="grid gap-6 sm:gap-8 sm:grid-cols-2">
                          <ConfigField label="Travel Pace" description="Density calibration.">
                             <Select name="travelPace" defaultValue={profile?.travelPace ?? "medium"} className="h-11 bg-surface font-bold uppercase border-border text-xs">
                                <option>slow</option><option>medium</option><option>packed</option>
                             </Select>
                          </ConfigField>
                          <ConfigField label="Preferred Months" description="Weather telemetry.">
                             <Input name="preferredTravelMonths" defaultValue={profile?.preferredTravelMonths ?? ""} className="h-11 bg-surface font-bold uppercase border-border text-xs" placeholder="JUNE — AUGUST" />
                          </ConfigField>
                       </div>
                       <ConfigField label="Core Interests" description="Targeted keywords.">
                          <Input name="favoriteActivities" defaultValue={profile?.favoriteActivities ?? ""} className="h-11 bg-surface font-bold uppercase border-border text-xs" placeholder="HIKING, MUSEUMS, FINE DINING" />
                       </ConfigField>
                       <ConfigField label="Constraints" description="Avoid entirely.">
                          <Input name="thingsToAvoid" defaultValue={profile?.thingsToAvoid ?? ""} className="h-11 bg-surface font-bold uppercase border-border text-xs" placeholder="CROWDS, LONG FLIGHTS" />
                       </ConfigField>
                    </div>
                  )}

                  {activeTab === "Financials" && (
                    <div className="space-y-8 sm:space-y-10">
                       <div className="grid gap-6 sm:gap-8 sm:grid-cols-2">
                          <ConfigField label="Budget Strategy">
                             <Select name="budgetStyle" defaultValue={profile?.budgetStyle ?? "balanced"} className="h-11 bg-surface font-bold uppercase border-border text-xs">
                                <option>budget</option><option>balanced</option><option>comfort</option><option>luxury</option>
                             </Select>
                          </ConfigField>
                          <ConfigField label="Accommodation Type">
                             <Input name="preferredHotelType" defaultValue={profile?.preferredHotelType ?? ""} className="h-11 bg-surface font-bold uppercase border-border text-xs" placeholder="BOUTIQUE, RESORT, HOSTEL" />
                          </ConfigField>
                       </div>
                    </div>
                  )}

                  {activeTab === "Identity" && (
                    <div className="space-y-8 sm:space-y-10">
                       <div className="grid gap-6 sm:gap-8 sm:grid-cols-2">
                          <ConfigField label="Home Airport">
                             <Input name="homeAirport" defaultValue={profile?.homeAirport ?? ""} className="h-11 bg-surface font-bold uppercase border-border text-xs" placeholder="LHR, LAX, CDG" />
                          </ConfigField>
                          <ConfigField label="Passport">
                             <Input name="passportNationality" defaultValue={profile?.passportNationality ?? ""} className="h-11 bg-surface font-bold uppercase border-border text-xs" placeholder="OPTIONAL" />
                          </ConfigField>
                       </div>
                       <label className="flex min-h-14 cursor-pointer items-center gap-4 rounded-xl border border-border bg-surface px-6 py-4 transition-all hover:bg-background has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background shadow-inner">
                          <input name="hiddenGemInterest" type="checkbox" defaultChecked={profile?.hiddenGemInterest ?? true} className="hidden" />
                          <span className="text-[10px] font-black uppercase tracking-[0.1em]">Prioritize Hidden Gems</span>
                       </label>
                    </div>
                  )}

                  {activeTab === "Internal" && (
                    <div className="space-y-6">
                       <ConfigField label="Foundational Memo" description="AI context.">
                          <Textarea name="notes" defaultValue={profile?.notes ?? ""} className="min-h-[250px] sm:min-h-[400px] bg-surface border-border p-6 sm:p-8 text-sm font-medium leading-relaxed shadow-inner rounded-xl" placeholder="CONTEXT FOR THE AI PLANNER..." />
                       </ConfigField>
                    </div>
                  )}
               </motion.div>
             </AnimatePresence>
           </div>

           <footer className="mt-12 shrink-0 border-t border-border pt-8 sm:mt-20 sm:pt-10 pb-10 sm:pb-0">
              <button type="submit" className="h-12 sm:h-14 w-full bg-foreground text-background shadow-2xl hover:bg-zinc-800 dark:hover:bg-zinc-200 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-3">
                 <Save size={16} /> <span className="hidden xs:inline">Sync Profile Data</span><span className="xs:hidden">Sync Profile</span>
              </button>
           </footer>
        </form>

        {/* Tactical Status Rail */}
        <footer className="sticky bottom-0 flex h-10 items-center justify-between border-t border-border bg-surface px-6 text-[9px] font-black uppercase tracking-widest text-muted">
           <div className="flex items-center gap-4">
              <span className="flex items-center gap-2"><CheckCircle2 size={12} /> SECURE PERSISTENCE</span>
           </div>
           <span>PROTOCOL: HIGH-DENSITY PROFILE V2</span>
        </footer>
      </main>
    </div>
  );
}

function LogNode({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted opacity-60">
       <div className="size-1 rounded-full bg-border-strong" />
       <span>{text}</span>
    </div>
  );
}

function ConfigField({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
       <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground">{label}</label>
          {description && <p className="text-[9px] font-medium text-muted uppercase tracking-wider">{description}</p>}
       </div>
       {children}
    </div>
  );
}
