import { BudgetWorkspace } from "@/components/travel/budget-workspace";
import { getExchangeRate } from "@/lib/api/currencyService";
import { getPrimaryTrip, toTripDraft } from "@/lib/db/travel";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const dbTrip = await getPrimaryTrip();
  const trip = dbTrip ? toTripDraft(dbTrip) : null;
  const categories = dbTrip ? dbTrip.budgetCategories.map((item) => ({ name: item.name, estimated: item.estimatedAmount, actual: item.actualAmount })) : [];
  const eurRate = await getExchangeRate("USD", "EUR");

  return <BudgetWorkspace trip={trip} categories={categories} eurRate={eurRate} />;
}
