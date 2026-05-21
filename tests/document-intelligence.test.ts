import { describe, it, expect } from "vitest";

interface MockNote {
  title: string;
  documentType: string | null;
  expiryDate: string | null;
}

// Mock helper to simulate the warning logic in DocumentsWorkspace
function getDocumentWarnings(notes: MockNote[]) {
  const today = new Date("2026-05-19T12:00:00.000Z");
  const list: { type: "missing" | "expiry", message: string }[] = [];
  
  const hasType = (t: string) => notes.some(n => n.documentType === t);

  // Missing checks
  if (!hasType("Passport")) list.push({ type: "missing", message: "Passport record is missing." });
  if (!hasType("Visa")) list.push({ type: "missing", message: "Visa record is missing." });
  if (!hasType("Travel insurance")) list.push({ type: "missing", message: "Travel insurance is missing." });

  // Expiry checks
  notes.forEach(note => {
    if (note.expiryDate) {
      const expiry = new Date(note.expiryDate);
      const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        list.push({ type: "expiry", message: `${note.documentType || note.title} has EXPIRED.` });
      } else if (diffDays < 30) {
        list.push({ type: "expiry", message: `${note.documentType || note.title} expires in ${diffDays} days.` });
      } else if (diffDays < 180 && note.documentType === "Passport") {
        list.push({ type: "expiry", message: `Passport expires in less than 6 months (${diffDays} days).` });
      }
    } else if (note.documentType === "Passport") {
      list.push({ type: "expiry", message: "Passport expiry date is not recorded." });
    }
  });

  return list;
}

describe("Document Intelligence", () => {
  it("detects missing required documents", () => {
    const notes: MockNote[] = [];
    const warnings = getDocumentWarnings(notes);
    expect(warnings).toContainEqual({ type: "missing", message: "Passport record is missing." });
    expect(warnings).toContainEqual({ type: "missing", message: "Visa record is missing." });
  });

  it("detects expired documents", () => {
    const notes: MockNote[] = [
      { title: "My Passport", documentType: "Passport", expiryDate: "2026-05-01T12:00:00.000Z" }
    ];
    const warnings = getDocumentWarnings(notes);
    expect(warnings).toContainEqual({ type: "expiry", message: "Passport has EXPIRED." });
  });

  it("warns about passport expiring within 6 months", () => {
    const notes: MockNote[] = [
      { title: "My Passport", documentType: "Passport", expiryDate: "2026-08-19T12:00:00.000Z" } // 3 months away
    ];
    const warnings = getDocumentWarnings(notes);
    expect(warnings).toContainEqual({ type: "expiry", message: expect.stringContaining("Passport expires in less than 6 months") });
  });

  it("detects missing passport expiry date", () => {
    const notes: MockNote[] = [
      { title: "My Passport", documentType: "Passport", expiryDate: null }
    ];
    const warnings = getDocumentWarnings(notes);
    expect(warnings).toContainEqual({ type: "expiry", message: "Passport expiry date is not recorded." });
  });
});
