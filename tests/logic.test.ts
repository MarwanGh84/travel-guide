import { describe, it, expect } from "vitest";
import { tripLength, normalizeName } from "../src/lib/utils";
import { getHiddenGemScore } from "../src/lib/ai/openai";

describe("Trip Logic", () => {
  it("computes correct trip length", () => {
    expect(tripLength("2026-05-15", "2026-05-15")).toBe(1);
    expect(tripLength("2026-05-15", "2026-05-18")).toBe(4);
  });

  it("handles end date before start date by returning 0", () => {
    expect(tripLength("2026-05-18", "2026-05-15")).toBe(0);
  });

  it("normalizes names consistently", () => {
    expect(normalizeName("  Uluwatu Temple  ")).toBe("uluwatu temple");
    expect(normalizeName("Cafe-Del-Mar")).toBe("cafe del mar");
  });

  it("generates deterministic hidden gem scores", () => {
    const score1 = getHiddenGemScore("Uluwatu", "Temple");
    const score2 = getHiddenGemScore("Uluwatu", "Temple");
    const score3 = getHiddenGemScore("Seminyak", "Cafe");
    
    expect(score1).toBe(score2);
    expect(score1).not.toBe(score3);
    expect(score1).toBeGreaterThanOrEqual(0);
    expect(score1).toBeLessThan(100);
  });
});
