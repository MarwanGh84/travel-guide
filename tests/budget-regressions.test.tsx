import { describe, expect, it, vi } from "vitest";

const pageDeps = vi.hoisted(() => ({
  getPrimaryTrip: vi.fn(),
  getExchangeRate: vi.fn(),
}));

vi.mock("../src/lib/db/travel", () => ({
  getPrimaryTrip: pageDeps.getPrimaryTrip,
  toTripDraft: vi.fn((trip) => ({ budget: trip.budget })),
}));
vi.mock("../src/lib/api/currencyService", () => ({
  getExchangeRate: pageDeps.getExchangeRate,
}));
vi.mock("../src/lib/travel/currencies", () => ({
  getCurrencyForCountry: vi.fn(() => null),
}));

import BudgetPage from "../src/app/budget/page";

describe("budget regressions", () => {
  it("passes actual expense rows through to the budget workspace", async () => {
    pageDeps.getPrimaryTrip.mockResolvedValue({
      budget: 2400,
      currency: "USD",
      startDate: new Date("2026-05-18T00:00:00.000Z"),
      endDate: new Date("2026-05-20T00:00:00.000Z"),
      destinationCountry: "Lebanon",
      budgetCategories: [{ name: "Food", estimatedAmount: 500, actualAmount: 0 }],
      expenses: [
        {
          id: "expense-1",
          category: "Food",
          amount: 125,
          currency: "USD",
          note: "Lunch",
          spentAt: new Date("2026-05-18T12:00:00.000Z"),
        },
      ],
      itineraryDays: [],
      bookings: [],
    });

    const element = await BudgetPage();

    expect(element.props.expenses).toEqual([
      {
        id: "expense-1",
        category: "Food",
        amount: 125,
        currency: "USD",
        note: "Lunch",
        spentAt: "2026-05-18",
      },
    ]);
  });
});
