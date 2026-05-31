"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const SHORTCUTS: Record<string, string> = {
  i: "/itinerary",
  d: "/discover",
  b: "/budget",
  l: "/documents",
  t: "/today",
  m: "/map",
  s: "/stays",
};

/**
 * Registers global G+<key> keyboard shortcuts (e.g. G then I → /itinerary).
 * Press G to start a chord, then the second key within 1 second to navigate.
 * Ignored when focus is inside an input, textarea, or contenteditable element.
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const waitingForSecondKey = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function isInputFocused() {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || (el as HTMLElement).isContentEditable;
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (isInputFocused()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (waitingForSecondKey.current) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        waitingForSecondKey.current = false;

        const route = SHORTCUTS[key];
        if (route) {
          e.preventDefault();
          router.push(route);
        }
        return;
      }

      if (key === "g") {
        e.preventDefault();
        waitingForSecondKey.current = true;
        timeoutRef.current = setTimeout(() => {
          waitingForSecondKey.current = false;
        }, 1000);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [router]);

  return null;
}
