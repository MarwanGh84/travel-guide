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
  X
} from "lucide-react";
import { addExpense, deleteExpense, updateExpense } from "@/app/actions";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { TripDraft } from "@/lib/types/travel";
import { useRouter } from "next/navigation";

type BudgetWorkspaceProps = {
  trip: TripDraft | null;
  categories: { name: string; estimated: number; actual: number }[];
  expenses: { id: string; category: string; amount: number; currency: string; note?: string | null; spentAt: string }[];
  baseCurrency: string;
  destinationCurrency: string | null;
  exchangeRate: { rate: number; source: { provider: string; isMock: boolean; note: string } } | null;
};

export function BudgetWorkspace({ trip, categories, expenses, baseCurrency, destinationCurrency, exchangeRate }: BudgetWorkspaceProps) {
  const router = useRouter();
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const actualTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = (trip?.budget ?? 0) - actualTotal;
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
      <header className="flex h-auto shrink-0 flex-col gap-6 border-b border-border bg-surface px-6 py-4 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
           <SummaryMetric label="BUDGET" value={formatCurrency(trip?.budget ?? 0)} />
           <div className="hidden h-8 w-px bg-border/50 sm:block" />
           <SummaryMetric label="SPENT" value={formatCurrency(actualTotal)} />
           <div className="hidden h-8 w-px bg-border/50 sm:block" />
           <SummaryMetric label="REMAINING" value={formatCurrency(remaining)} tone={remaining >= 0 ? "positive" : "negative"} />
        </div>
        
        <div className="flex items-center gap-2">
           <button 
              onClick={exportCsv}
              className="flex h-8 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-black transition-all sm:flex-none"
           >
              <Download size={12} /> <span className="hidden xs:inline">Export CSV</span><span className="xs:hidden">Export</span>
           </button>
           <button
             onClick={() => setShowExpenseForm((current) => !current)}
             className="flex h-8 flex-1 items-center justify-center gap-2 rounded-md bg-black px-3 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-zinc-800 transition-all sm:flex-none"
           >
              <PlusCircle size={12} /> <span className="hidden xs:inline">New Expense</span><span className="xs:hidden">Add</span>
           </button>
        </div>
      </header>

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
          <button type="submit" className="h-10 rounded-md bg-black px-4 text-[10px] font-black uppercase tracking-widest text-white sm:h-9">Save Expense</button>
        </form>
      )}

      {/* 2. Main Ledger Area */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="hidden sm:block">
          <table className="w-full border-collapse text-left">
             <thead>
                <tr className="sticky top-0 z-10 border-b border-border bg-surface text-[10px] font-black uppercase tracking-[0.1em] text-muted">
                   <th className="px-6 py-3 font-black">Category</th>
                   <th className="px-6 py-3 font-black text-right">Estimated</th>
                   <th className="px-6 py-3 font-black text-right">Actual</th>
                   <th className="px-6 py-3 font-black text-right">Difference</th>
                   <th className="px-6 py-3 font-black">Utilization</th>
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
                          <span className="text-xs font-medium text-muted">{formatCurrency(cat.estimated)}</span>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <span className="text-xs font-bold text-foreground">{formatCurrency(cat.actual)}</span>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <span className={cn(
                            "text-xs font-bold",
                            diff >= 0 ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {diff > 0 ? "+" : ""}{formatCurrency(diff)}
                          </span>
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-2 border border-border">
                                <div 
                                   className={cn(
                                     "h-full transition-all duration-700",
                                     util > 100 ? "bg-rose-500" : util > 80 ? "bg-amber-500" : "bg-black"
                                   )}
                                   style={{ width: `${Math.min(100, util)}%` }}
                                />
                             </div>
                             <span className="text-[10px] font-bold text-muted w-8">{Math.round(util)}%</span>
                          </div>
                       </td>
                    </tr>
                  );
                })}
             </tbody>
          </table>
        </div>

        {/* Mobile Category Cards */}
        <div className="space-y-4 p-4 sm:hidden">
           {displayedCategories.map((cat) => {
              const diff = cat.estimated - cat.actual;
              const util = cat.estimated > 0 ? (cat.actual / cat.estimated) * 100 : 0;
              return (
                <div key={cat.name} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-black uppercase tracking-tight text-foreground">{cat.name}</span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        diff >= 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                      )}>
                        {diff > 0 ? "+" : ""}{formatCurrency(diff)}
                      </span>
                   </div>
                   <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                         <p className="text-[8px] font-black uppercase tracking-widest text-muted mb-1">Estimated</p>
                         <p className="text-sm font-bold text-muted">{formatCurrency(cat.estimated)}</p>
                      </div>
                      <div>
                         <p className="text-[8px] font-black uppercase tracking-widest text-muted mb-1">Actual</p>
                         <p className="text-sm font-black text-foreground">{formatCurrency(cat.actual)}</p>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-background border border-border">
                         <div 
                            className={cn(
                              "h-full transition-all duration-700",
                              util > 100 ? "bg-rose-500" : util > 80 ? "bg-amber-500" : "bg-black"
                            )}
                            style={{ width: `${Math.min(100, util)}%` }}
                         />
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-[9px] font-bold uppercase tracking-widest text-muted">Utilization</span>
                         <span className="text-[9px] font-black text-foreground">{Math.round(util)}%</span>
                      </div>
                   </div>
                </div>
              );
           })}
        </div>

        <section className="border-t border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Recent Records</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{expenses.length} TOTAL</span>
          </div>
          <div className="divide-y divide-border/40">
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
                    <button type="submit" className="h-10 flex-1 rounded-md bg-black px-4 text-[10px] font-black uppercase tracking-widest text-white md:h-9 md:flex-none">Save</button>
                    <button type="button" onClick={() => setEditingExpenseId(null)} className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-background text-muted hover:text-foreground md:size-9">
                      <X size={16} />
                    </button>
                  </div>
                </form>
              ) : (
                <div key={expense.id} className="grid grid-cols-2 gap-x-4 gap-y-2 px-6 py-5 text-sm md:grid md:grid-cols-[140px_120px_120px_1fr_auto]">
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
                    <span className="truncate text-muted italic text-xs">&quot;{expense.note || "No memo recorded"}&quot;</span>
                  </div>
                  <div className="flex items-center justify-end gap-2 col-span-2 md:col-span-1 border-t border-border/40 pt-4 mt-2 md:border-none md:pt-0 md:mt-0">
                    <button
                      type="button"
                      onClick={() => setEditingExpenseId(expense.id)}
                      className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background text-muted hover:text-black md:size-8 md:flex-none"
                      aria-label={`Edit ${expense.category} expense`}
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
                        aria-label={`Delete ${expense.category} expense`}
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

      {/* 3. Bottom Information Rail */}
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
            <span className="flex items-center gap-1.5 whitespace-nowrap"><ArrowUpRight size={12} className={cn(remaining >= 0 ? "text-emerald-500" : "text-rose-500")} /> {remaining >= 0 ? "Under Limit" : "Limit Breached"}</span>
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
       <span className="text-[9px] font-black tracking-widest text-muted">{label}</span>
       <span className={cn(
         "text-xl font-bold tracking-tight",
         tone === "positive" ? "text-emerald-600" : tone === "negative" ? "text-rose-600" : "text-foreground"
       )}>
         {value}
       </span>
    </div>
  );
}
