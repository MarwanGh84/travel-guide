import { describe, expect, it } from "vitest";
import { parseTravelEmail } from "../src/lib/imports/travelEmailParser";

describe("gmail import classification", () => {
  it("accepts a hotel confirmation as high confidence", () => {
    const result = parseTravelEmail({
      from: "confirmations@booking.com",
      subject: "Booking confirmation: The Cove Hotel",
      body: [
        "Booking confirmation",
        "Hotel name: The Cove Hotel",
        "Confirmation number: ABC12345",
        "Check-in: Mar 21, 2026",
        "Check-out: Mar 22, 2026",
        "Address: 10 Beach Road",
      ].join("\n"),
    });

    expect(result.confidenceLabel).toBe("high-confidence");
    expect(result.autoSelect).toBe(true);
  });

  it("accepts a flight confirmation as high confidence", () => {
    const result = parseTravelEmail({
      from: "itinerary@airline.example",
      subject: "Flight confirmation",
      body: [
        "Flight confirmation",
        "Itinerary number: ZXCVB123",
        "Departure: Apr 02, 2026",
        "Return: Apr 09, 2026",
        "Passenger: Marwan Ghostine",
      ].join("\n"),
    });

    expect(result.bookingType).toBe("Flight");
    expect(result.confidenceLabel).toBe("high-confidence");
    expect(result.autoSelect).toBe(true);
  });

  it("rejects a bank transaction alert", () => {
    const result = parseTravelEmail({
      from: "MashreqAlerts@mashreq.com",
      subject: "Transaction Confirmation on Mashreq Card",
      body: "Your card ending with 5462 was used for a purchase of EUR 10.50. Available limit is AED 665.05.",
    });

    expect(result.confidenceLabel).toBe("rejected");
    expect(result.autoSelect).toBe(false);
    expect(result.rejectionReasons).toContain("bank transaction");
  });

  it("rejects a generic receipt without travel context", () => {
    const result = parseTravelEmail({
      from: "receipts@example.com",
      subject: "Your receipt",
      body: "Receipt for order 12345. Amount paid: USD 42.00. Thank you for your purchase.",
    });

    expect(result.confidenceLabel).toBe("rejected");
    expect(result.autoSelect).toBe(false);
    expect(result.rejectionReasons).toContain("receipt without travel context");
  });

  it("keeps travel marketing emails out of automatic saving", () => {
    const result = parseTravelEmail({
      from: "offers@expedia.com",
      subject: "Weekend hotel deals",
      body: "Book now and save on hotels. Offer expires Sunday. Unsubscribe anytime.",
    });

    expect(result.confidenceLabel).not.toBe("high-confidence");
    expect(result.autoSelect).toBe(false);
  });
});
