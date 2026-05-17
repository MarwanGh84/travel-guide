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
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* 1. Header Command Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
        <div className="flex items-center gap-8">
           <SummaryMetric label="TOTAL BUDGET" value={formatCurrency(trip?.budget ?? 0)} />
           <div className="h-8 w-px bg-border/50" />
           <SummaryMetric label="ACTUAL SPEND" value={formatCurrency(actualTotal)} />
           <div className="h-8 w-px bg-border/50" />
           <SummaryMetric label="REMAINING" value={formatCurrency(remaining)} tone={remaining >= 0 ? "positive" : "negative"} />
        </div>
        
        <div className="flex items-center gap-2">
           <button 
              onClick={exportCsv}
              className="flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-black transition-all"
           >
              <Download size={12} /> Export CSV
           </button>
           <button
             onClick={() => setShowExpenseForm((current) => !current)}
             className="flex h-8 items-center gap-2 rounded-md bg-black px-3 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-zinc-800 transition-all"
           >
              <PlusCircle size={12} /> New Expense
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
          <select name="category" defaultValue="Food" className="h-9 rounded-md border border-border bg-surface px-3 text-xs">
            {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <input name="amount" type="number" min="0" step="0.01" required placeholder="Amount" className="h-9 rounded-md border border-border bg-surface px-3 text-xs" />
          <input name="spentAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="h-9 rounded-md border border-border bg-surface px-3 text-xs" />
          <input name="note" placeholder="Note" className="h-9 rounded-md border border-border bg-surface px-3 text-xs" />
          <button type="submit" className="h-9 rounded-md bg-black px-4 text-[10px] font-bold uppercase tracking-widest text-white">Save</button>
        </form>
      )}

      {/* 2. Main Ledger Area */}
      <main className="flex-1 overflow-y-auto">
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
              {displayedCategories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                    No budget categories configured yet
                  </td>
                </tr>
              )}
           </tbody>
        </table>

        <section className="border-t border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Recent Expenses</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{expenses.length} records</span>
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
                  className="grid gap-2 px-6 py-4 text-xs md:grid-cols-[140px_120px_140px_1fr_auto]"
                >
                  <input type="hidden" name="expenseId" value={expense.id} />
                  <select name="category" defaultValue={expense.category} className="h-9 rounded-md border border-border bg-surface px-3 text-xs">
                    {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                  <input name="amount" type="number" min="0" step="0.01" required defaultValue={expense.amount} className="h-9 rounded-md border border-border bg-surface px-3 text-xs" />
                  <input name="spentAt" type="date" required defaultValue={expense.spentAt} className="h-9 rounded-md border border-border bg-surface px-3 text-xs" />
                  <input name="note" defaultValue={expense.note ?? ""} placeholder="Note" className="h-9 rounded-md border border-border bg-surface px-3 text-xs" />
                  <div className="flex items-center gap-2">
                    <button type="submit" className="h-9 rounded-md bg-black px-3 text-[10px] font-bold uppercase tracking-widest text-white">Save</button>
                    <button type="button" onClick={() => setEditingExpenseId(null)} className="grid size-9 place-items-center rounded-md border border-border text-muted hover:text-foreground">
                      <X size={14} />
                    </button>
                  </div>
                </form>
              ) : (
                <div key={expense.id} className="grid gap-2 px-6 py-4 text-xs md:grid-cols-[140px_120px_120px_1fr_auto]">
                  <span className="font-bold text-foreground">{expense.category}</span>
                  <span className="font-bold text-foreground">{formatCurrency(expense.amount, expense.currency)}</span>
                  <span className="text-muted">{expense.spentAt}</span>
                  <span className="truncate text-muted">{expense.note || "No note"}</span>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingExpenseId(expense.id)}
                      className="grid size-8 place-items-center rounded-md border border-border text-muted hover:text-foreground"
                      aria-label={`Edit ${expense.category} expense`}
                    >
                      <Pencil size={13} />
                    </button>
                    <form
                      action={async (formData) => {
                        await deleteExpense(formData);
                        router.refresh();
                      }}
                    >
                      <input type="hidden" name="expenseId" value={expense.id} />
                      <button
                        type="submit"
                        className="grid size-8 place-items-center rounded-md border border-border text-muted hover:text-rose-600"
                        aria-label={`Delete ${expense.category} expense`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </form>
                  </div>
                </div>
              )
            ))}
            {expenses.length === 0 && (
              <div className="px-6 py-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                No expenses recorded
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 3. Bottom Information Rail */}
      <footer className="flex h-12 shrink-0 items-center justify-between border-t border-border bg-surface px-6 text-[10px] font-black uppercase tracking-widest text-muted">
         <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <Search size={12} />
              {exchangeRate?.source.provider ?? "currency-unavailable"}
            </span>
            {exchangeRate && !exchangeRate.source.isMock && exchangeRate.rate > 0 && destinationCurrency ? (
              <span className="text-foreground">
                1 {baseCurrency} = {exchangeRate.rate.toFixed(3)} {destinationCurrency}
              </span>
            ) : (
              <span className="text-foreground">
                {destinationCurrency ? `Conversion to ${destinationCurrency} unavailable` : "Destination currency unavailable"}
              </span>
            )}
            <div className="h-4 w-px bg-border" />
            <span className="flex items-center gap-2"><ShieldCheck size={12} className="text-emerald-500" /> Compliance Active</span>
         </div>
         <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><ArrowUpRight size={12} className={cn(remaining >= 0 ? "text-emerald-500" : "text-rose-500")} /> {remaining >= 0 ? "Under total budget" : "Budget threshold exceeded"}</span>
            <div className="h-4 w-px bg-border" />
            <span className="text-foreground">Press CMD+K for shortcuts</span>
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
