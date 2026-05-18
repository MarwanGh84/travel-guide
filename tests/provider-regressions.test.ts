import { afterEach, describe, expect, it, vi } from "vitest";
import { getExchangeRate } from "../src/lib/api/currencyService";
import { searchLiveHotels } from "../src/lib/api/hotelsService";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("provider regressions", () => {
  it("returns an unavailable currency fallback when Frankfurter does not support a pair", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ amount: 1, base: "USD", date: "2026-05-18", rates: {} }), {
          status: 200,
        }),
      ),
    );

    const result = await getExchangeRate("USD", "LBP");

    expect(result).toMatchObject({
      base: "USD",
      quote: "LBP",
      rate: 0,
      source: {
        provider: "currency-unavailable",
        classification: "fallback",
      },
    });
  });

  it("keeps provider-empty hotel searches honest without fake hotels or prices", async () => {
    vi.stubEnv("RAPIDAPI_KEY", "test-key");
    vi.stubEnv("RAPIDAPI_HOST", "booking-com15.p.rapidapi.com");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: true, data: { result: [] } }), {
          status: 200,
        }),
      ),
    );

    const result = await searchLiveHotels(34.12, 35.65, "2026-05-18", "2026-05-20", 2);

    expect(result).toMatchObject({
      hotels: [],
      status: "empty",
      provider: "rapidapi-booking-com15",
    });
  });
});
