"use client";

import { useState } from "react";
import { Clipboard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyTripSearchDetails({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copyDetails() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copyDetails} className={cn(className)}>
      {copied ? <Check size={15} /> : <Clipboard size={15} />}
      {copied ? "Copied" : "Copy trip search details"}
    </Button>
  );
}
