"use client";

import { useState } from "react";
import { 
  Utensils, 
  Train, 
  Sparkles, 
  ShieldCheck, 
  Edit3, 
  X, 
  Save, 
  Loader2, 
  CloudRain, 
  RefreshCw,
  type LucideIcon 
} from "lucide-react";
import { Textarea } from "@/components/ui/input";
import type { ItineraryDay } from "@/lib/types/travel";

type ItineraryEditorProps = {
  day: ItineraryDay;
  onSave: (updated: ItineraryDay) => Promise<void>;
  busy: boolean;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
};

export function ItineraryEditor({
  day,
  onSave,
  busy,
  editMode,
  setEditMode,
}: ItineraryEditorProps) {
  const [draft, setDraft] = useState(day);
  const [adjustmentBusy, setAdjustmentBusy] = useState("");
  const [adjustmentStatus, setAdjustmentStatus] = useState("");
  const [adjustmentError, setAdjustmentError] = useState("");
  const [suggestion, setSuggestion] = useState<ItineraryDay | null>(null);

  async function requestAdjustment(label: string, instruction: string) {
    setAdjustmentBusy(label);
    setAdjustmentStatus(`Creating ${label.toLowerCase()} suggestion...`);
    setAdjustmentError("");
    setSuggestion(null);

    const response = await fetch("/api/ai/adjust-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, instruction }),
    });
    const result = await response.json();
    setAdjustmentBusy("");

    if (!response.ok || !result.ok || !result.data) {
      setAdjustmentStatus("");
      setAdjustmentError(result.raw ?? result.message ?? "Could not adjust this day.");
      return;
    }

    setSuggestion({ ...day, ...result.data, id: day.id, date: day.date });
    setAdjustmentStatus("Suggestion ready.");
  }

  async function applySuggestion() {
    if (!suggestion) return;
    await onSave(suggestion);
    setSuggestion(null);
    setAdjustmentStatus("Suggestion applied.");
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-6 bg-background">
          <div className="flex items-center justify-between mb-8">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted">{editMode ? "Editor Active" : "Operational Controls"}</span>
            {!editMode ? (
              <button onClick={() => setEditMode(true)} className="flex items-center gap-2 text-[9px] font-black uppercase text-muted hover:text-foreground transition-colors">
                <Edit3 size={12} /> Edit Plan
              </button>
            ) : (
              <button onClick={() => setEditMode(false)} className="flex items-center gap-2 text-[9px] font-black uppercase text-rose-600 hover:text-rose-700 transition-colors">
                <X size={12} /> Cancel
              </button>
            )}
          </div>
          
          <div className="space-y-6">
             <DetailSection
               icon={Utensils}
               title="Restaurant ideas"
               content={day.restaurantIdeas}
               caption="AI suggestions — verify they're open and worth a visit before booking."
             />
             <DetailSection icon={Train} title="Getting around" content={day.transportNotes} />
             <DetailSection icon={Sparkles} title="Hidden gem" content={day.hiddenGem} />
             <DetailSection icon={ShieldCheck} title="Backup plan" content={day.backupOption} />
          </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-10 border-t border-border mt-4">
          {editMode ? (
            <div className="space-y-8">
              <EditField label="Morning Plan">
                  <Textarea value={draft.morningPlan} onChange={(e) => setDraft({ ...draft, morningPlan: e.target.value })} className="min-h-[80px] bg-surface text-xs" />
              </EditField>
              <EditField label="Afternoon Plan">
                  <Textarea value={draft.afternoonPlan} onChange={(e) => setDraft({ ...draft, afternoonPlan: e.target.value })} className="min-h-[80px] bg-surface text-xs" />
              </EditField>
              <EditField label="Evening Plan">
                  <Textarea value={draft.eveningPlan} onChange={(e) => setDraft({ ...draft, eveningPlan: e.target.value })} className="min-h-[80px] bg-surface text-xs" />
              </EditField>
            </div>
          ) : (
            <section className="space-y-4 pt-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">AI Day Tools</h3>
                <div className="grid grid-cols-2 gap-2">
                  <DayToolButton
                    label="Regenerate"
                    busy={adjustmentBusy === "Regenerate"}
                    icon={RefreshCw}
                    onClick={() => requestAdjustment("Regenerate", "Regenerate this day with the same destination, interests, and budget. Keep it practical.")}
                  />
                  <DayToolButton
                    label="More relaxed"
                    busy={adjustmentBusy === "More relaxed"}
                    onClick={() => requestAdjustment("More relaxed", "Make this day more relaxed with fewer moves and more breathing room.")}
                  />
                  <DayToolButton
                    label="Cheaper"
                    busy={adjustmentBusy === "Cheaper"}
                    onClick={() => requestAdjustment("Cheaper", "Make this day cheaper with more free activities and lower-cost food.")}
                  />
                  <DayToolButton
                    label="Rain plan"
                    busy={adjustmentBusy === "Rain plan"}
                    icon={CloudRain}
                    onClick={() => requestAdjustment("Rain plan", "Replace outdoor activities with indoor rainy-day alternatives.")}
                  />
                </div>
                {adjustmentStatus ? <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{adjustmentStatus}</p> : null}
                {adjustmentError ? <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600">{adjustmentError}</p> : null}
                {suggestion && (
                  <div className="space-y-3 rounded-xl border border-border bg-background p-4 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted">Suggested Change</p>
                    <p className="text-xs font-bold uppercase text-foreground">{suggestion.theme}</p>
                    <button
                      type="button"
                      onClick={applySuggestion}
                      disabled={busy}
                      className="flex h-9 w-full items-center justify-center rounded-md bg-foreground px-4 text-[9px] font-black uppercase tracking-widest text-background transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
                    >
                      Apply Suggestion
                    </button>
                  </div>
                )}
            </section>
          )}
      </div>

      {editMode && (
        <div className="p-6 border-t border-border bg-surface">
            <button 
              onClick={() => onSave(draft)}
              disabled={busy}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-foreground text-[10px] font-black uppercase tracking-[0.2em] text-background shadow-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Commit Changes
            </button>
        </div>
      )}
    </div>
  );
}

function DetailSection({ icon: Icon, title, content, caption }: { icon: LucideIcon, title: string, content?: string | string[], caption?: string }) {
  if (!content || (Array.isArray(content) && content.length === 0)) return null;
  return (
    <section>
       <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3 flex items-center gap-2">
          <Icon size={10} /> {title}
       </h3>
       <p className="text-xs leading-relaxed text-muted-2 font-medium">
          {Array.isArray(content) ? content.join(", ") : content}
       </p>
       {caption && (
         <p className="mt-2 text-[10px] italic leading-relaxed text-muted/70">{caption}</p>
       )}
    </section>
  );
}

function EditField({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-3">
       <label className="text-[9px] font-black uppercase tracking-[0.1em] text-muted">{label}</label>
       {children}
    </div>
  );
}

function DayToolButton({
  label,
  busy,
  icon: Icon,
  onClick,
}: {
  label: string;
  busy: boolean;
  icon?: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-[9px] font-black uppercase tracking-widest text-muted transition-all hover:text-foreground disabled:opacity-50"
    >
      {busy ? <Loader2 size={12} className="animate-spin" /> : Icon ? <Icon size={12} /> : null}
      {label}
    </button>
  );
}
