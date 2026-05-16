"use client";

import { useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CloudRain,
  Edit3,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import type { ItineraryDay } from "@/lib/types/travel";
import { formatCurrency } from "@/lib/utils";

type ItineraryDayCardProps = {
  day: ItineraryDay;
  index: number;
  totalDays: number;
  onPrevious: () => void;
  onNext: () => void;
  onChange?: (day: ItineraryDay) => void;
  onDelete?: () => void;
  externalSuggestion?: ItineraryDay | null;
};

type AiAction = {
  label: string;
  instruction: string;
  icon?: typeof RefreshCw;
};

const aiActions: AiAction[] = [
  { label: "Regenerate", instruction: "Regenerate this day with the same destination, interests, and budget. Keep it practical.", icon: RefreshCw },
  { label: "More relaxed", instruction: "Make this day more relaxed with fewer moves and more breathing room." },
  { label: "Cheaper", instruction: "Make this day cheaper with more free activities and lower-cost food." },
  { label: "Rain plan", instruction: "Replace outdoor activities with indoor rainy-day alternatives.", icon: CloudRain },
];

export function ItineraryDayCard({
  day,
  index,
  totalDays,
  onPrevious,
  onNext,
  onChange,
  onDelete,
  externalSuggestion,
}: ItineraryDayCardProps) {
  const [currentDay, setCurrentDay] = useState(day);
  const [draft, setDraft] = useState(day);
  const [editMode, setEditMode] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState<ItineraryDay | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const visibleDay = editMode ? draft : currentDay;
  const visibleSuggestion = suggestion ?? externalSuggestion;
  const dateLabel = new Date(`${visibleDay.date}T12:00:00.000Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  async function saveDay(nextDay = draft) {
    setBusyAction("save");
    setError("");
    setStatus("Saving itinerary day...");
    const response = await fetch("/api/itinerary/day", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextDay),
    });
    const result = await response.json();
    setBusyAction(null);

    if (!response.ok || !result.data) {
      setError(result.message ?? "Could not save this day.");
      setStatus("");
      return;
    }

    setCurrentDay(result.data);
    setDraft(result.data);
    setSuggestion(null);
    setEditMode(false);
    setStatus("Day saved.");
    onChange?.(result.data);
  }

  async function adjustDay(label: string, instruction: string) {
    setBusyAction(label);
    setError("");
    setSuggestion(null);
    setStatus(`Creating ${label.toLowerCase()} suggestion...`);
    const response = await fetch("/api/ai/adjust-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day: currentDay, instruction }),
    });
    const result = await response.json();
    setBusyAction(null);

    if (!response.ok || !result.data) {
      setError(result.raw ?? "AI could not adjust this day.");
      setStatus("");
      return;
    }

    setSuggestion({ ...currentDay, ...result.data, id: currentDay.id, date: currentDay.date });
    setStatus("Suggestion ready. Compare it before applying.");
  }

  function cancelEdit() {
    setDraft(currentDay);
    setEditMode(false);
  }

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[16px] bg-white p-6 shadow-sm lg:p-10">
      <header className="flex flex-col gap-6 border-b border-[#dfd2c3] pb-8">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-[#7d6556]">Day {index + 1} of {totalDays}</p>
          <div className="flex items-center gap-3">
             <ArrowButton onClick={onPrevious} direction="left" />
             <ArrowButton onClick={onNext} direction="right" />
          </div>
        </div>
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            {editMode ? (
              <Input
                className="h-14 border-[#dfd2c3] bg-[#fffaf5] text-2xl font-serif text-[#31190d]"
                value={draft.theme}
                onChange={(event) => setDraft({ ...draft, theme: event.target.value })}
              />
            ) : (
              <h1 className="max-w-[20ch] break-words font-serif text-4xl leading-[1.1] tracking-tight lg:text-5xl">{visibleDay.theme}</h1>
            )}
          </div>
          {!editMode && (
            <PanelButton onClick={() => setEditMode(true)}>
              <Edit3 size={16} />
              <span>Edit Day</span>
            </PanelButton>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm font-medium text-[#7d6556]">
          <span>{dateLabel}</span>
          <span className="opacity-30">•</span>
          <span>{formatCurrency(visibleDay.estimatedCost)}</span>
          <span className="opacity-30">•</span>
          <span>{visibleDay.placesIncluded.length} Places</span>
        </div>
      </header>

      <div className="min-h-0 flex-1 divide-y divide-[#dfd2c3]/40 overflow-y-auto">
        <ScheduleRow
          marker="AM"
          title="Morning"
          value={visibleDay.morningPlan}
          editing={editMode}
          draftValue={draft.morningPlan}
          onChange={(value) => setDraft({ ...draft, morningPlan: value })}
        />
        <ScheduleRow
          marker="PM"
          title="Afternoon"
          value={visibleDay.afternoonPlan}
          editing={editMode}
          draftValue={draft.afternoonPlan}
          onChange={(value) => setDraft({ ...draft, afternoonPlan: value })}
        />
        <ScheduleRow
          marker="EV"
          title="Evening"
          value={visibleDay.eveningPlan}
          editing={editMode}
          draftValue={draft.eveningPlan}
          onChange={(value) => setDraft({ ...draft, eveningPlan: value })}
        />
      </div>

      {editMode ? (
        <div className="mt-6 border-t border-[#dfd2c3] pt-6">
          <label className="grid gap-2 text-xs font-bold uppercase tracking-widest text-[#7d6556]">
            Notes
            <Textarea
              className="min-h-24 border-[#dfd2c3] bg-[#fffaf5] p-4 text-[0.95rem] text-[#31190d]"
              value={draft.notes}
              onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
            />
          </label>
        </div>
      ) : null}

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#dfd2c3] pt-6">
        <div className="flex flex-wrap items-center gap-3">
          {editMode ? (
            <>
              <PanelButton onClick={() => saveDay()} disabled={busyAction === "save"} strong>
                {busyAction === "save" ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </PanelButton>
              <PanelButton onClick={cancelEdit}>
                <X size={16} />
                Cancel
              </PanelButton>
            </>
          ) : (
            <>
              <PanelButton onClick={() => setToolsOpen((value) => !value)}>
                <Sparkles size={16} />
                AI Tools
              </PanelButton>
              {onDelete ? (
                <PanelButton onClick={onDelete}>
                  <Trash2 size={16} />
                  Delete
                </PanelButton>
              ) : null}
            </>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {status ? <span className="text-xs font-bold uppercase tracking-wider text-[#6b4329]">{status}</span> : null}
          {error ? <span className="text-xs font-bold uppercase tracking-wider text-rose-600">{error}</span> : null}
        </div>
      </footer>

      {toolsOpen && !editMode ? (
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#dfd2c3] pt-6 lg:grid-cols-4">
          {aiActions.map((action) => {
            const Icon = action.icon;
            return (
              <PanelButton key={action.label} onClick={() => adjustDay(action.label, action.instruction)} disabled={busyAction === action.label} className="justify-center">
                {busyAction === action.label ? <Loader2 className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
                {action.label}
              </PanelButton>
            );
          })}
        </div>
      ) : null}

      {visibleSuggestion ? (
        <div className="mt-8 rounded-[12px] border border-[#dfd2c3] bg-[#fbf7f1] p-6 shadow-sm transition-all animate-in fade-in zoom-in-95">
          <p className="text-xs font-bold uppercase tracking-widest text-[#7d6556]">Suggested Change</p>
          <p className="mt-3 font-serif text-xl leading-relaxed text-[#31190d]">{visibleSuggestion.theme}</p>
          <div className="mt-6 flex gap-3">
            <PanelButton onClick={() => saveDay(visibleSuggestion)} strong>
              Apply Suggestion
            </PanelButton>
            <PanelButton onClick={() => setSuggestion(null)}>
              Dismiss
            </PanelButton>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ScheduleRow({
  marker,
  title,
  value,
  editing,
  draftValue,
  onChange,
}: {
  marker: string;
  title: string;
  value: string;
  editing: boolean;
  draftValue: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="group flex flex-col gap-4 py-8 lg:py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-6 w-10 items-center justify-center rounded-md bg-[#6b4329]/10 text-[10px] font-bold tracking-widest text-[#6b4329]">
          {marker}
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-[#7d6556]">
          {title}
        </span>
      </div>
      {editing ? (
        <Textarea 
          className="min-h-24 border-[#dfd2c3] bg-[#fffaf5] p-4 text-[1rem] leading-relaxed text-[#31190d]" 
          value={draftValue} 
          onChange={(event) => onChange(event.target.value)} 
        />
      ) : (
        <p className="text-lg leading-relaxed text-[#31190d] lg:text-xl lg:leading-loose">
          {value || "No plans scheduled yet."}
        </p>
      )}
    </div>
  );
}

function ArrowButton({ onClick, direction }: { onClick: () => void; direction: "left" | "right" }) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button type="button" onClick={onClick} className="grid size-11 place-items-center rounded-full border border-[#dfd2c3] bg-white transition-all hover:border-[#bda791] hover:bg-white active:scale-95 shadow-sm">
      <Icon size={20} />
    </button>
  );
}

function PanelButton({
  children,
  onClick,
  disabled,
  className = "",
  strong = false,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  strong?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-12 items-center gap-2 rounded-[12px] border px-6 text-sm font-medium transition-all ${
        strong
          ? "border-[#6b4329] bg-[#6b4329] text-white shadow-md hover:bg-[#5a3822]"
          : "border-[#dfd2c3] bg-white text-[#31190d] hover:border-[#bda791] hover:bg-[#fbf7f1]"
      } disabled:border-[#eadfd2] disabled:bg-[#f3eadf] disabled:text-[#8c7464] disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
