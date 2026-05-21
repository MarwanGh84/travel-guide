import { BudgetWorkspace } from "@/components/travel/budget-workspace";
import { getExchangeRate } from "@/lib/api/currencyService";
import { getPrimaryTrip, toTripDraft } from "@/lib/db/travel";
import { getCurrencyForCountry } from "@/lib/travel/currencies";
import { computeBudgetIntelligence } from "@/lib/travel/budget-intelligence";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const dbTrip = await getPrimaryTrip();
  const trip = dbTrip ? toTripDraft(dbTrip) : null;
  const budgetIntelligence = computeBudgetIntelligence(dbTrip);

  const categories = dbTrip ? dbTrip.budgetCategories.map((item) => ({ name: item.name, estimated: item.estimatedAmount, actual: item.actualAmount })) : [];
  const expenses = dbTrip
    ? dbTrip.expenses.map((expense) => ({
        id: expense.id,
        category: expense.category,
        amount: expense.amount,
        currency: expense.currency,
        note: expense.note,
        spentAt: expense.spentAt.toISOString().slice(0, 10),
      }))
    : [];
  const destinationCurrency = getCurrencyForCountry(dbTrip?.destinationCountry ?? "");
  const exchangeRate =
    dbTrip && destinationCurrency && dbTrip.currency !== destinationCurrency
      ? await getExchangeRate(dbTrip.currency, destinationCurrency)
      : null;

  return (
    <BudgetWorkspace
      trip={trip}
      categories={categories}
      expenses={expenses}
      baseCurrency={dbTrip?.currency ?? "USD"}
      destinationCurrency={destinationCurrency}
      exchangeRate={exchangeRate}
      intelligence={budgetIntelligence}
    />
  );
}
