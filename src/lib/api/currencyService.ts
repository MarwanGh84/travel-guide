import type { DataSource } from "@/lib/types/travel";
import { FrankfurterResponseSchema } from "@/lib/validation/schemas";

export type ExchangeRate = {
  base: string;
  quote: string;
  rate: number;
  source: DataSource;
};

export async function getExchangeRate(base = "USD", quote = "EUR"): Promise<ExchangeRate> {
  try {
    const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${base}&symbols=${quote}`, {
      next: { revalidate: 60 * 60 * 12 },
    });
    if (!response.ok) return fallbackRate(base, quote, `Frankfurter failed with ${response.status}.`);
    const data = FrankfurterResponseSchema.parse(await response.json());
    const rate = data.rates?.[quote];
    if (!rate) return fallbackRate(base, quote, "Frankfurter did not return this currency pair.");
    return {
      base,
      quote,
      rate,
      source: {
        provider: "frankfurter",
        isMock: false,
        classification: "provider",
        note: "Live no-key Frankfurter exchange rate.",
      },
    };
  } catch (error) {
    return fallbackRate(base, quote, error instanceof Error ? error.message : "Currency lookup failed.");
  }
}

function fallbackRate(base: string, quote: string, note: string): ExchangeRate {
  return {
    base,
    quote,
    rate: 0,
    source: {
      provider: "currency-unavailable",
      isMock: true,
      classification: "fallback",
      note,
    },
  };
}
