import { PrimaryTrip } from "@/lib/db/travel";
import { getDestinationMultiplier } from "./cost-index";

export type BudgetEstimateCategory = "accommodation" | "food" | "activities" | "transport" | "shopping" | "misc";

export type BudgetEstimateItem = {
  category: BudgetEstimateCategory;
  estimatedLow: number;
  estimatedHigh: number;
  estimatedMid: number;
  currency: string;
  source: "approved-itinerary" | "booking" | "manual-assumption" | "unavailable";
  confidence: "high" | "medium" | "low" | "unavailable";
  explanation: string;
};

export type BudgetIntelligence = {
  estimates: BudgetEstimateItem[];
  totalEstimatedMid: number;
  warnings: string[];
  itineraryApproved: boolean;
  
  // Burn Rate Metrics
  daysTotal: number;
  daysRemaining: number;
  safeDailySpend: number;
  actualDailyPace: number;
  projectedTotalSpend: number;
  burnRateStatus: "optimal" | "warning" | "critical";
};

export function computeBudgetIntelligence(trip: PrimaryTrip | null): BudgetIntelligence {
  if (!trip) {
    return { 
      estimates: [], 
      totalEstimatedMid: 0, 
      warnings: ["No active trip selected."], 
      itineraryApproved: false,
      daysTotal: 0,
      daysRemaining: 0,
      safeDailySpend: 0,
      actualDailyPace: 0,
      projectedTotalSpend: 0,
      burnRateStatus: "optimal"
    };
  }

  const warnings: string[] = [];
  const estimates: BudgetEstimateItem[] = [];
  const isApproved = trip.status === "itinerary_approved";

  const now = new Date();
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const daysTotal = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  
  // Calculate days remaining and elapsed
  const daysElapsed = Math.max(1, Math.min(daysTotal, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))));
  const daysRemaining = Math.max(1, daysTotal - daysElapsed + 1);

  const travelers = trip.travelerCount || 1;
  const multiplier = getDestinationMultiplier(trip.destinationCountry);

  // 1. Accommodation
  const hotelBooking = trip.bookings.find(b => b.type.toLowerCase().includes("hotel") || b.type.toLowerCase().includes("stay"));
  const hotelExpenses = trip.expenses.filter(e => e.category.toLowerCase().includes("hotel") || e.category.toLowerCase().includes("stay"));
  const realHotelCost = hotelExpenses.reduce((sum, e) => sum + e.amount, 0);

  if (realHotelCost > 0) {
    estimates.push({
      category: "accommodation",
      estimatedLow: realHotelCost,
      estimatedHigh: realHotelCost,
      estimatedMid: realHotelCost,
      currency: trip.currency,
      source: "booking",
      confidence: "high",
      explanation: "Based on recorded hotel expenses."
    });
  } else if (hotelBooking) {
    warnings.push("Hotel booking exists but no cost entered in expenses.");
    estimates.push({
      category: "accommodation",
      estimatedLow: 100 * daysTotal, // Rough fallback
      estimatedHigh: 300 * daysTotal,
      estimatedMid: 200 * daysTotal,
      currency: trip.currency,
      source: "manual-assumption",
      confidence: "low",
      explanation: "Rough planning estimate based on duration."
    });
  } else if (isApproved) {
    warnings.push("Itinerary approved but no hotel/stay booking identified.");
    estimates.push({
      category: "accommodation",
      estimatedLow: 0,
      estimatedHigh: 0,
      estimatedMid: 0,
      currency: trip.currency,
      source: "unavailable",
      confidence: "unavailable",
      explanation: "No booking found."
    });
  }

  // 2. Food & Dining
  if (isApproved) {
    const baseMealPrice = trip.pace === "packed" ? 50 : trip.pace === "slow" ? 30 : 40;
    const mealPrice = baseMealPrice * multiplier;
    const foodMid = mealPrice * 3 * daysTotal * travelers;
    estimates.push({
      category: "food",
      estimatedLow: foodMid * 0.8,
      estimatedHigh: foodMid * 1.5,
      estimatedMid: foodMid,
      currency: trip.currency,
      source: "approved-itinerary",
      confidence: "medium",
      explanation: `Estimate for 3 meals/day for ${travelers} traveler(s) over ${daysTotal} days (Destination Factor: ${multiplier.toFixed(1)}x).`
    });
  }

  // 3. Activities
  if (isApproved) {
    const activityItems = trip.itineraryDays.flatMap(d => d.items);
    const aiOnlyCount = activityItems.filter(item => !item.placeRecommendationId).length;
    if (aiOnlyCount > 0) {
      warnings.push(`Itinerary has ${aiOnlyCount} AI-only points, activity estimate confidence is lower.`);
    }

    const activityCostPerPlace = 20 * multiplier; 
    const activityMid = activityItems.length * activityCostPerPlace * travelers;
    estimates.push({
      category: "activities",
      estimatedLow: activityMid * 0.5,
      estimatedHigh: activityMid * 2,
      estimatedMid: activityMid,
      currency: trip.currency,
      source: "approved-itinerary",
      confidence: aiOnlyCount > 0 ? "low" : "medium",
      explanation: `Based on ${activityItems.length} scheduled points in itinerary (Destination Factor: ${multiplier.toFixed(1)}x).`
    });
  }

  // 4. Transport
  if (isApproved) {
    const transportMid = 25 * multiplier * daysTotal;
    estimates.push({
      category: "transport",
      estimatedLow: transportMid * 0.5,
      estimatedHigh: transportMid * 2,
      estimatedMid: transportMid,
      currency: trip.currency,
      source: "approved-itinerary",
      confidence: "low",
      explanation: `Daily transport allowance estimate (Destination Factor: ${multiplier.toFixed(1)}x).`
    });
  }

  // 5. Shopping & Misc (Manual/Empty by default)
  estimates.push({
    category: "shopping",
    estimatedLow: 0,
    estimatedHigh: 0,
    estimatedMid: 0,
    currency: trip.currency,
    source: "unavailable",
    confidence: "unavailable",
    explanation: "Manual allowance only."
  });

  const totalEstimatedMid = estimates.reduce((sum, item) => sum + item.estimatedMid, 0);

  // Global Warnings
  const actualSpend = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
  if (actualSpend > trip.budget) {
    warnings.push("Actual spend exceeds trip budget!");
  }
  if (totalEstimatedMid > trip.budget) {
    warnings.push("Estimated itinerary cost exceeds trip budget!");
  }
  if (trip.expenses.length === 0) {
    warnings.push("No expenses entered yet.");
  }

  // --- Burn Rate Intelligence ---
  
  // Committed costs = Flights + Accommodation (already spent)
  const committedCosts = trip.expenses
    .filter(e => /flight|hotel|stay|accommodation/i.test(e.category))
    .reduce((sum, e) => sum + e.amount, 0);

  // Daily variables (exclude committed costs from the budget available for daily fun)
  const availableDailyBudget = trip.budget - committedCosts;
  const safeDailySpend = Math.max(0, availableDailyBudget / daysTotal);
  
  // Non-committed spend (food, activities, etc)
  const dailySpendActual = trip.expenses
    .filter(e => !/flight|hotel|stay|accommodation/i.test(e.category))
    .reduce((sum, e) => sum + e.amount, 0);
    
  const actualDailyPace = dailySpendActual / daysElapsed;
  
  // Forecasting
  const projectedTotalSpend = committedCosts + (actualDailyPace * daysTotal);
  
  let burnRateStatus: "optimal" | "warning" | "critical" = "optimal";
  if (actualDailyPace > safeDailySpend * 1.3) burnRateStatus = "critical";
  else if (actualDailyPace > safeDailySpend * 1.1) burnRateStatus = "warning";

  return {
    estimates,
    totalEstimatedMid,
    warnings,
    itineraryApproved: isApproved,
    daysTotal,
    daysRemaining,
    safeDailySpend,
    actualDailyPace,
    projectedTotalSpend,
    burnRateStatus
  };
}
