"use client";

import { useState } from "react";
import {
  Search, 
  ArrowUpRight, 
  PlusCircle,
  Download,
  ShieldCheck,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Target,
  TrendingDown,
  TrendingUp,
  Activity,
  Zap,
  BarChart3,
  LucideIcon
} from "lucide-react";
import { addExpense, deleteExpense, updateExpense } from "@/app/actions";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { TripDraft } from "@/lib/types/travel";
import type { BudgetIntelligence } from "@/lib/travel/budget-intelligence";
import { useRouter } from "next/navigation";

type BudgetWorkspaceProps = {
  trip: TripDraft | null;
  categories: { name: string; estimated: number; actual: number }[];
  expenses: { id: string; category: string; amount: number; currency: string; note?: string | null; spentAt: string }[];
  baseCurrency: string;
  destinationCurrency: string | null;
  exchangeRate: { rate: number; source: { provider: string; isMock: boolean; note: string } } | null;
  intelligence: BudgetIntelligence;
};

export function BudgetWorkspace({ trip, categories, expenses, baseCurrency, destinationCurrency, exchangeRate, intelligence }: BudgetWorkspaceProps) {
  const router = useRouter();
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const actualTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remainingAfterActuals = (trip?.budget ?? 0) - actualTotal;

  const expenseTotalsByCategory = expenses.reduce<Record<string, number>>((totals, expense) => {
    totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount;
    return totals;
  }, {});

  const displayedCategories = Array.from(
    new Map([
      ...categories.map((category) => [category.name, { ...category, actual: expenseTotalsByCategory[category.name] ?? category.actual }] as const),
      ...Object.entries(expenseTotalsByCategory).map(([name, actual]) => [name, { name, estimated: 0, actual }] as const),
    ]).values(),
  );

  const categoryOptions = Array.from(new Set([
    "Flights",
    "Hotel",
    "Food",
    "Activities",
    "Transport",
    "Shopping",
    "Emergency buffer",
    ...categories.map((category) => category.name),
    ...expenses.map((expense) => expense.category),
  ]));

  const exportCsv = () => {
    const data = "Category,Estimated,Actual,Difference\n" + displayedCategories.map(c => `${c.name},${c.estimated},${c.actual},${c.estimated - c.actual}`).join("\n");
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-${trip?.destination || 'trip'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto lg:overflow-hidden bg-background">
      {/* 1. Header Command Bar */}
      <header className="flex h-auto shrink-0 flex-col gap-6 border-b border-border bg-surface px-6 py-6 sm:h-20 sm:flex-row sm:items-center sm:justify-between sm:py-0">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
           <SummaryMetric label="TOTAL BUDGET" value={formatCurrency(trip?.budget ?? 0)} />
           <div className="hidden h-8 w-px bg-border/50 sm:block" />
           <SummaryMetric label="SPENT (ACTUAL)" value={formatCurrency(actualTotal)} tone={actualTotal > (trip?.budget ?? 0) ? "negative" : "neutral"} />
           <div className="hidden h-8 w-px bg-border/50 sm:block" />
           <SummaryMetric label="REMAINING (ACTUAL)" value={formatCurrency(remainingAfterActuals)} tone={remainingAfterActuals >= 0 ? "positive" : "negative"} />
           <div className="hidden h-8 w-px bg-border/50 sm:block" />
           <SummaryMetric label="EST. ITINERARY COST" value={formatCurrency(intelligence.totalEstimatedMid)} tone={intelligence.totalEstimatedMid > (trip?.budget ?? 0) ? "negative" : "neutral"} />
        </div>
        
        <div className="flex items-center gap-2">
           <button 
              onClick={exportCsv}
              className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground hover:border-foreground transition-all active:scale-95 sm:flex-none"
           >
              <Download size={12} /> <span className="hidden xs:inline">CSV</span>
           </button>
           <button
             onClick={() => setShowExpenseForm((current: boolean) => !current)}
             className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-[10px] font-black uppercase tracking-widest text-background hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 sm:flex-none shadow-lg"
           >
              <PlusCircle size={12} /> <span className="hidden xs:inline">New Record</span><span className="xs:hidden">Add</span>
           </button>
        </div>
      </header>

      {/* 2. Tactical Burn Rate Monitor (NEW) */}
      <section className="bg-surface/50 border-b border-border p-6 lg:p-8">
         <div className="flex items-center gap-3 mb-8">
            <Activity size={16} className="text-foreground" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Burn Rate Intelligence</h2>
            <div className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest",
              intelligence.burnRateStatus === "optimal" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20" :
              intelligence.burnRateStatus === "warning" ? "bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20" :
              "bg-rose-500/10 text-rose-600 dark:text-rose-500 border border-rose-500/20"
            )}>
               <div className={cn("size-1.5 rounded-full animate-pulse", 
                 intelligence.burnRateStatus === "optimal" ? "bg-emerald-500" : 
                 intelligence.burnRateStatus === "warning" ? "bg-amber-500" : "bg-rose-500")} 
               />
               Mission Status: {intelligence.burnRateStatus}
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BurnMetric 
               label="Safe Daily Ceiling" 
               value={formatCurrency(intelligence.safeDailySpend)} 
               description="Max spend to stay within budget"
               icon={ShieldCheck}
            />
            <BurnMetric 
               label="Current Daily Pace" 
               value={formatCurrency(intelligence.actualDailyPace)} 
               description="Average spend to date"
               icon={Zap}
               tone={intelligence.burnRateStatus === "critical" ? "negative" : intelligence.burnRateStatus === "warning" ? "warning" : "positive"}
            />
            <BurnMetric 
               label="Projected End State" 
               value={formatCurrency(intelligence.projectedTotalSpend)} 
               description={`Vs. ${formatCurrency(trip?.budget ?? 0)} total budget`}
               icon={BarChart3}
               tone={intelligence.projectedTotalSpend > (trip?.budget ?? 0) ? "negative" : "positive"}
            />
         </div>

         {/* Forecasting Banner */}
         <div className={cn(
           "mt-8 flex items-center justify-between rounded-xl border-2 p-5 shadow-sm",
           intelligence.projectedTotalSpend <= (trip?.budget ?? 0) 
             ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-500" 
             : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-500"
         )}>
            <div className="flex items-center gap-4">
               {intelligence.projectedTotalSpend <= (trip?.budget ?? 0) ? <TrendingDown size={24} /> : <TrendingUp size={24} />}
               <div>
                  <p className="text-[11px] font-black uppercase tracking-tight">Financial Projection</p>
                  <p className="text-sm font-bold tracking-tight">
                    {intelligence.projectedTotalSpend <= (trip?.budget ?? 0) 
                      ? `Target on track. Current pace yields ${formatCurrency((trip?.budget ?? 0) - intelligence.projectedTotalSpend)} surplus.`
                      : `Limit breach imminent. Expected to exceed budget by ${formatCurrency(intelligence.projectedTotalSpend - (trip?.budget ?? 0))}.`}
                  </p>
               </div>
            </div>
            <div className="hidden sm:block text-right">
               <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Days Remaining</p>
               <p className="text-lg font-black tracking-tighter">{intelligence.daysRemaining} / {intelligence.daysTotal}</p>
            </div>
         </div>
      </section>

      {/* 3. Intelligence Warnings */}
      {intelligence.warnings.length > 0 && (
        <section className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex flex-wrap gap-4 items-center">
           <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <AlertTriangle size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Budget Insights</span>
           </div>
           <div className="flex flex-wrap gap-x-6 gap-y-1">
              {intelligence.warnings.map((w, i) => (
                <p key={i} className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tight">• {w}</p>
              ))}
           </div>
        </section>
      )}

      {showExpenseForm && (
        <form
          action={async (formData) => {
            await addExpense(formData);
            setShowExpenseForm(false);
            router.refresh();
          }}
          className="grid shrink-0 gap-3 border-b border-border bg-background px-6 py-4 md:grid-cols-[1fr_140px_150px_1fr_auto]"
        >
          <select name="category" defaultValue="Food" className="h-10 rounded-md border border-border bg-surface px-3 text-sm sm:h-9 sm:text-xs">
            {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <input name="amount" type="number" min="0" step="0.01" required placeholder="Amount" className="h-10 rounded-md border border-border bg-surface px-3 text-sm sm:h-9 sm:text-xs" />
          <input name="spentAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="h-10 rounded-md border border-border bg-surface px-3 text-sm sm:h-9 sm:text-xs" />
          <input name="note" placeholder="Note" className="h-10 rounded-md border border-border bg-surface px-3 text-sm sm:h-9 sm:text-xs" />
          <button type="submit" className="h-10 rounded-md bg-foreground px-4 text-[10px] font-black uppercase tracking-widest text-background sm:h-9">Save Record</button>
        </form>
      )}

      {/* 3. Main Ledger Area */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        
        {/* A. Auto-Budget from Itinerary (New Section) */}
        {intelligence.itineraryApproved && intelligence.estimates.length > 0 && (
          <section className="p-6 border-b border-border bg-surface/30">
            <div className="flex items-center gap-3 mb-6">
               <Target size={16} className="text-foreground" />
               <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Itinerary-Based Estimates</h2>
               <span className="rounded-full bg-foreground px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-background">Projected</span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
               {intelligence.estimates.map((est) => (
                 <div key={est.category} className="rounded-xl border-2 border-border bg-background p-5 transition-all duration-300 hover:border-foreground hover:shadow-xl hover:-translate-y-0.5 group">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-[10px] font-black uppercase tracking-tight text-foreground">{est.category}</span>
                       <span className={cn(
                         "text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest",
                         est.confidence === "high" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20" :
                         est.confidence === "medium" ? "bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20" :
                         "bg-surface-2 text-muted border-border"
                       )}>
                         {est.confidence} confidence
                       </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-4">
                       <span className="text-2xl font-black text-foreground tracking-tighter">{formatCurrency(est.estimatedMid, est.currency)}</span>
                       <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                         Range: {formatCurrency(est.estimatedLow, est.currency)}–{formatCurrency(est.estimatedHigh, est.currency)}
                       </span>
                    </div>
                    <p className="text-[10px] font-medium leading-relaxed text-muted uppercase tracking-tight border-t border-border/50 pt-4 group-hover:text-foreground transition-colors">
                       {est.explanation}
                    </p>
                    <p className="mt-2 text-[8px] font-black text-muted/40 uppercase tracking-[0.2em]">Source: {est.source}</p>
                 </div>
               ))}
            </div>
          </section>
        )}

        {/* B. Existing Manual Categories Table */}
        <div className="hidden sm:block">
          <div className="px-6 py-4 border-b border-border bg-background">
             <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Category Utilization (User-Defined)</h2>
          </div>
          <table className="w-full border-collapse text-left">
             <thead>
                <tr className="sticky top-0 z-10 border-b border-border bg-surface text-[10px] font-black uppercase tracking-[0.1em] text-muted">
                   <th className="px-6 py-3 font-black">Category</th>
                   <th className="px-6 py-3 font-black text-right">Target</th>
                   <th className="px-6 py-3 font-black text-right">Actual</th>
                   <th className="px-6 py-3 font-black text-right">Remaining</th>
                   <th className="px-6 py-3 font-black">Capacity</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-border/40">
                {displayedCategories.map((cat) => {
                  const diff = cat.estimated - cat.actual;
                  const util = cat.estimated > 0 ? (cat.actual / cat.estimated) * 100 : 0;
                  return (
                    <tr key={cat.name} className="group hover:bg-surface/50 transition-colors">
                       <td className="px-6 py-4">
                          <span className="text-xs font-bold text-foreground">{cat.name}</span>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <span className="text-xs font-medium text-muted">{cat.estimated > 0 ? formatCurrency(cat.estimated) : "—"}</span>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <span className="text-xs font-bold text-foreground">{formatCurrency(cat.actual)}</span>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <span className={cn(
                            "text-xs font-bold",
                            diff >= 0 ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {cat.estimated > 0 ? (diff > 0 ? "+" : "") + formatCurrency(diff) : "—"}
                          </span>
                       </td>
                       <td className="px-6 py-4">
                          {cat.estimated > 0 ? (
                            <div className="flex items-center gap-3">
                               <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-2 border border-border">
                                  <div 
                                     className={cn(
                                       "h-full transition-all duration-700",
                                       util > 100 ? "bg-rose-500" : util > 80 ? "bg-amber-500" : "bg-foreground"
                                     )}
                                     style={{ width: `${Math.min(100, util)}%` }}
                                  />
                               </div>
                               <span className="text-[10px] font-bold text-muted w-8">{Math.round(util)}%</span>
                            </div>
                          ) : (
                            <span className="text-[8px] font-black text-muted/30 uppercase tracking-widest">Ad-hoc record</span>
                          )}
                       </td>
                    </tr>
                  );
                })}
             </tbody>
          </table>
        </div>

        {/* C. Expense Records */}
        <section className="border-t border-border">
          <div className="flex items-center justify-between px-6 py-6 bg-surface/20">
            <div className="flex items-center gap-3">
               <ShieldCheck size={14} className="text-emerald-500" />
               <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Spending Telemetry (Actuals)</h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{expenses.length} RECORDS SYNCED</span>
          </div>
          <div className="divide-y divide-border/40 bg-background">
            {expenses.map((expense) => (
              editingExpenseId === expense.id ? (
                <form
                  key={expense.id}
                  action={async (formData) => {
                    await updateExpense(formData);
                    setEditingExpenseId(null);
                    router.refresh();
                  }}
                  className="flex flex-col gap-3 bg-surface-2 px-6 py-6 md:grid md:grid-cols-[140px_120px_140px_1fr_auto]"
                >
                  <input type="hidden" name="expenseId" value={expense.id} />
                  <select name="category" defaultValue={expense.category} className="h-10 rounded-md border border-border bg-background px-3 text-sm md:h-9 md:text-xs">
                    {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                  <input name="amount" type="number" min="0" step="0.01" required defaultValue={expense.amount} className="h-10 rounded-md border border-border bg-background px-3 text-sm md:h-9 md:text-xs" />
                  <input name="spentAt" type="date" required defaultValue={expense.spentAt} className="h-10 rounded-md border border-border bg-background px-3 text-sm md:h-9 md:text-xs" />
                  <input name="note" defaultValue={expense.note ?? ""} placeholder="Note" className="h-10 rounded-md border border-border bg-background px-3 text-sm md:h-9 md:text-xs" />
                  <div className="flex items-center gap-2 mt-2 md:mt-0">
                    <button type="submit" className="h-10 flex-1 rounded-md bg-foreground px-4 text-[10px] font-black uppercase tracking-widest text-background md:h-9 md:flex-none">Save</button>
                    <button type="button" onClick={() => setEditingExpenseId(null)} className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-background text-muted hover:text-foreground md:size-9">
                      <X size={16} />
                    </button>
                  </div>
                </form>
              ) : (
                <div key={expense.id} className="grid grid-cols-2 gap-x-4 gap-y-2 px-6 py-5 text-sm md:grid md:grid-cols-[140px_120px_120px_1fr_auto] hover:bg-surface/30 transition-colors">
                  <div className="flex flex-col md:block">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted md:hidden">Category</span>
                    <span className="font-bold text-foreground truncate">{expense.category}</span>
                  </div>
                  <div className="flex flex-col text-right md:block md:text-left">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted md:hidden">Amount</span>
                    <span className="font-black text-foreground">{formatCurrency(expense.amount, expense.currency)}</span>
                  </div>
                  <div className="flex flex-col md:block">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted md:hidden">Date</span>
                    <span className="text-muted-2 text-xs">{expense.spentAt}</span>
                  </div>
                  <div className="flex flex-col md:block col-span-2 md:col-span-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted md:hidden">Context</span>
                    <span className="truncate text-muted italic text-[11px]">&quot;{expense.note || "No memo recorded"}&quot;</span>
                  </div>
                  <div className="flex items-center justify-end gap-2 col-span-2 md:col-span-1 border-t border-border/40 pt-4 mt-2 md:border-none md:pt-0 md:mt-0">
                    <button
                      type="button"
                      onClick={() => setEditingExpenseId(expense.id)}
                      className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background text-muted hover:text-foreground md:size-8 md:flex-none"
                    >
                      <Pencil size={13} /> <span className="md:hidden text-[10px] font-bold uppercase tracking-widest">Edit</span>
                    </button>
                    <form
                      action={async (formData) => {
                        await deleteExpense(formData);
                        router.refresh();
                      }}
                      className="flex-1 md:flex-none"
                    >
                      <input type="hidden" name="expenseId" value={expense.id} />
                      <button
                        type="submit"
                        className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-muted hover:text-rose-600 md:size-8 md:flex-none"
                      >
                        <Trash2 size={13} /> <span className="md:hidden text-[10px] font-bold uppercase tracking-widest">Drop</span>
                      </button>
                    </form>
                  </div>
                </div>
              )
            ))}
            {expenses.length === 0 && (
              <div className="px-6 py-12 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                No expense telemetry found
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 4. Bottom Information Rail */}
      <footer className="flex h-auto shrink-0 flex-col gap-4 border-t border-border bg-surface px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted sm:h-12 sm:flex-row sm:items-center sm:justify-between sm:py-0">
         <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="flex items-center gap-2 whitespace-nowrap">
              <Search size={12} />
              {exchangeRate?.source.provider ?? "OFFLINE"}
            </span>
            {exchangeRate && !exchangeRate.source.isMock && exchangeRate.rate > 0 && destinationCurrency ? (
              <span className="text-foreground whitespace-nowrap">
                1 {baseCurrency} = {exchangeRate.rate.toFixed(3)} {destinationCurrency}
              </span>
            ) : (
              <span className="text-foreground whitespace-nowrap">
                {destinationCurrency ? `FX UNSTABLE` : "FX MISSING"}
              </span>
            )}
            <div className="hidden h-4 w-px bg-border sm:block" />
            <span className="flex items-center gap-2 whitespace-nowrap"><ShieldCheck size={12} className="text-emerald-500" /> System Secure</span>
         </div>
         <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/50 pt-4 sm:border-none sm:pt-0">
            <span className="flex items-center gap-1.5 whitespace-nowrap"><ArrowUpRight size={12} className={cn(remainingAfterActuals >= 0 ? "text-emerald-500" : "text-rose-500")} /> {remainingAfterActuals >= 0 ? "Under Limit" : "Limit Breached"}</span>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <span className="text-foreground whitespace-nowrap">USER: @marwanghostine</span>
         </div>
      </footer>
    </div>
  );
}

function SummaryMetric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "positive" | "negative" }) {
  return (
    <div className="flex flex-col gap-1">
       <span className="text-[9px] font-black tracking-widest text-muted whitespace-nowrap">{label}</span>
       <span className={cn(
         "text-xl font-bold tracking-tight whitespace-nowrap",
         tone === "positive" ? "text-emerald-600" : tone === "negative" ? "text-rose-600" : "text-foreground"
       )}>
         {value}
       </span>
    </div>
  );
}

function BurnMetric({ label, value, description, icon: Icon, tone = "neutral" }: { 
  label: string; 
  value: string; 
  description: string; 
  icon: LucideIcon; 
  tone?: "neutral" | "positive" | "negative" | "warning" 
}) {
  return (
    <div className="rounded-xl bg-background border border-border p-5 shadow-sm">
       <div className="flex items-center gap-3 mb-4">
          <div className="grid size-8 place-items-center rounded-lg bg-surface-2 text-muted">
             <Icon size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</span>
       </div>
       <p className={cn(
         "text-2xl font-black tracking-tighter",
         tone === "positive" ? "text-emerald-600" : 
         tone === "negative" ? "text-rose-600" : 
         tone === "warning" ? "text-amber-600" : "text-foreground"
       )}>{value}</p>
       <p className="mt-1 text-[9px] font-bold text-muted uppercase tracking-widest">{description}</p>
    </div>
  );
}

