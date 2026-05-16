import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function providerLabel(isMock: boolean) {
  return isMock ? "Not connected" : "Live data";
}

export function tripLength(startDate: string | Date, endDate: string | Date) {
  const start = new Date(typeof startDate === "string" ? `${startDate}T12:00:00.000Z` : startDate).getTime();
  const end = new Date(typeof endDate === "string" ? `${endDate}T12:00:00.000Z` : endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}

export function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
