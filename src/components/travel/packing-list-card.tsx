"use client";

import { useState } from "react";
import { Backpack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudioPanel } from "@/components/travel/studio";

export function PackingListCard() {
  const [items, setItems] = useState<string[]>([]);
  const [status, setStatus] = useState("Generate a weather-aware packing list when you need it.");

  async function generate() {
    setStatus("Generating packing list...");
    try {
      const response = await fetch("/api/ai/packing");
      const result = await response.json();
      setItems(Array.isArray(result.data) ? result.data : []);
      setStatus(result.isMock ? "OpenAI was unavailable. Try again in a moment." : `Generated with OpenAI using ${result.weather?.source?.provider ?? "weather"} context.`);
    } catch {
      setItems([]);
      setStatus("OpenAI was unavailable. Try again in a moment.");
    }
  }

  return (
    <StudioPanel className="mt-5" title="AI packing list" eyebrow="Weather-aware prep">
      <div className="grid gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="flex items-center gap-2 text-sm leading-6 text-[var(--muted)]"><Backpack size={18} /> {status}</p>
          <Button type="button" onClick={generate}>Generate packing list</Button>
        </div>
        {items.length ? (
          <div className="grid gap-3 text-sm text-[var(--muted-2)] md:grid-cols-2">
            {items.map((item) => <div key={item} className="rounded-xl bg-white/[0.045] p-3 font-semibold">{item}</div>)}
          </div>
        ) : null}
      </div>
    </StudioPanel>
  );
}
