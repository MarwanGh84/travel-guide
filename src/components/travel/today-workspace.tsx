"use client";

import { useState } from "react";
import { Sparkles, Loader2, MessageSquare, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/input";
import type { ItineraryDay } from "@/lib/types/travel";

export function TodayWorkspace({ day }: { day?: ItineraryDay }) {
  const [prompt, setPrompt] = useState("It is raining, adjust today with indoor options.");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!day) return;
    setLoading(true);
    setError("");
    setAnswer("");
    const response = await fetch("/api/ai/adjust-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, instruction: prompt }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok || !result.data) {
      setError(result.raw ?? "Could not suggest an adjustment.");
      return;
    }
    setAnswer(`${result.data.theme}: ${result.data.morningPlan} ${result.data.afternoonPlan} ${result.data.eveningPlan}`);
  }

  return (
    <section className="space-y-6">
      <div className="space-y-3">
         <div className="flex flex-wrap gap-1.5">
            {["Suggest a restaurant", "Shorten today", "Indoor backup", "Make it cheaper"].map((item) => (
              <button 
                key={item} 
                type="button" 
                onClick={() => setPrompt(item)}
                className="rounded-md border border-border bg-background px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-muted hover:text-foreground hover:border-foreground transition-all"
              >
                {item}
              </button>
            ))}
         </div>
         <Textarea 
            value={prompt} 
            onChange={(event) => setPrompt(event.target.value)} 
            className="min-h-[100px] bg-background border-border text-[11px] font-medium leading-relaxed shadow-inner p-4" 
            placeholder="Describe your requested adjustment..."
         />
      </div>

      <button 
        type="button" 
        onClick={ask} 
        disabled={!day || loading}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-foreground text-background text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-30 transition-all"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
        Get AI Suggestion
      </button>

      {answer && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 mb-3">
              <CheckCircle2 size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">AI Suggestion</span>
           </div>
           <p className="text-xs font-bold leading-relaxed text-emerald-900 dark:text-emerald-400 uppercase tracking-tight">{answer}</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-5">
           <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500 mb-2">
              <MessageSquare size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Something went wrong</span>
           </div>
           <p className="text-[10px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wide">{error}</p>
        </div>
      )}
    </section>
  );
}
