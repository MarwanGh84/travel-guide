"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudioPanel } from "@/components/travel/studio";

type SummaryResult = {
  summary: string;
  revisit: string[];
  nextTime: string[];
};

export function MemorySummaryCard() {
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [status, setStatus] = useState("Generate a final trip summary from saved journal notes.");

  async function generate() {
    setStatus("Generating trip summary...");
    try {
      const response = await fetch("/api/ai/summary");
      const result = await response.json();
      setSummary(result.data);
      setStatus(result.isMock ? "OpenAI was unavailable. Try again in a moment." : "Generated with OpenAI.");
    } catch {
      setSummary(null);
      setStatus("OpenAI was unavailable. Try again in a moment.");
    }
  }

  return (
    <StudioPanel title="Final trip summary" eyebrow="AI journal synthesis">
      <div className="grid gap-4 text-sm leading-6 text-[var(--muted)]">
        <div className="rounded-[8px] bg-white/[0.045] p-4">
          <p className="font-bold text-[var(--foreground)]">{status}</p>
          {summary ? <p className="mt-2">{summary.summary}</p> : null}
        </div>
        {summary?.revisit.length ? (
          <div>
            <p className="font-bold text-[var(--foreground)]">Places to revisit</p>
            <p>{summary.revisit.join(", ")}</p>
          </div>
        ) : null}
        {summary?.nextTime.length ? (
          <div>
            <p className="font-bold text-[var(--foreground)]">Next time</p>
            <p>{summary.nextTime.join(", ")}</p>
          </div>
        ) : null}
        <Button type="button" onClick={generate}><Sparkles /> Generate summary</Button>
      </div>
    </StudioPanel>
  );
}
