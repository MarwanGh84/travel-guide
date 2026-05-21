"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft, Info, TrendingUp, Landmark, CreditCard, Coins, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type ExchangeRateData = {
  base: string;
  quote: string;
  rate: number;
  date?: string;
  source: {
    provider: string;
    isMock: boolean;
    classification?: "provider" | "ai" | "computed" | "fallback" | "manual";
    note: string;
  };
};

type CurrencyWorkspaceProps = {
  baseCurrency: string;
  targetCurrency: string | null;
  initialRate: ExchangeRateData | null;
  tripBudget: number;
  tripDuration: number;
};

const currencyOptions = [
  "USD", "EUR", "GBP", "JPY", "AED", "AUD", "CAD", "CHF", "CNY", "HKD", "IDR", "INR", "KRW", "LBP", "MXN", "MYR", "NZD", "PHP", "SGD", "THB", "TRY", "ZAR"
];

export function CurrencyWorkspace({ baseCurrency: defaultBase, targetCurrency, initialRate, tripBudget, tripDuration }: CurrencyWorkspaceProps) {
  const [baseCurrency, setBaseCurrency] = useState(defaultBase);
  const [manualCurrency, setManualCurrency] = useState(targetCurrency ?? "");
  const [rate, setRate] = useState<ExchangeRateData | null>(initialRate);
  const [baseAmount, setBaseAmount] = useState("100");
  const effectiveCurrency = (targetCurrency ?? manualCurrency) || null;
  const [targetAmount, setTargetAmount] = useState(initialRate ? (100 * initialRate.rate).toFixed(2) : "");

  useEffect(() => {
    if (!effectiveCurrency) return;
    let cancelled = false;
    fetch(`/api/currency?base=${baseCurrency}&quote=${effectiveCurrency}`)
      .then((response) => response.json())
      .then((nextRate: ExchangeRateData) => {
        if (cancelled) return;
        setRate(nextRate);
        setTargetAmount(nextRate.rate ? (Number(baseAmount || 0) * nextRate.rate).toFixed(2) : "");
      })
      .catch(() => {
        if (!cancelled) setRate(null);
      });
    return () => {
      cancelled = true;
    };
  }, [baseAmount, baseCurrency, effectiveCurrency]);

  const dailySpend = tripDuration > 0 ? tripBudget / tripDuration : 0;
  const hasLiveRate = Boolean(rate && !rate.source.isMock && rate.rate > 0);
  const convertedBudget = hasLiveRate ? tripBudget * rate!.rate : null;
  const convertedDaily = hasLiveRate ? dailySpend * rate!.rate : null;

  const handleBaseChange = (value: string) => {
    setBaseAmount(value);
    const amount = Number(value);
    setTargetAmount(hasLiveRate && Number.isFinite(amount) ? (amount * rate!.rate).toFixed(2) : "");
  };

  const handleTargetChange = (value: string) => {
    setTargetAmount(value);
    const amount = Number(value);
    setBaseAmount(hasLiveRate && Number.isFinite(amount) ? (amount / rate!.rate).toFixed(2) : "");
  };

  const presets = [1, 10, 25, 50, 100, 500];

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto lg:grid lg:grid-cols-[380px_1fr] lg:overflow-hidden bg-background">
      {/* 1. Tactical Sidebar */}
      <aside className="border-b border-border bg-surface lg:border-b-0 lg:border-r p-6 lg:p-8 space-y-8 lg:overflow-y-auto">
        <header>
           <span className="text-[10px] font-black uppercase tracking-widest text-muted">Telemetry Control</span>
           <h2 className="mt-2 text-2xl font-black uppercase tracking-tighter text-foreground">Currency Sync</h2>
        </header>

        <section className="space-y-4">
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted ml-1">Base Asset</label>
              <select 
                value={baseCurrency}
                onChange={(e) => { setBaseCurrency(e.target.value); setRate(null); }}
                className="w-full h-12 rounded-xl border-2 border-border bg-background px-4 text-sm font-bold focus:border-black outline-none transition-all"
              >
                 {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
           </div>
           
           <div className="flex justify-center -my-2 relative z-10">
              <div className="bg-background rounded-full p-2 border-2 border-border shadow-sm">
                 <ArrowRightLeft size={14} className="text-black rotate-90 lg:rotate-0" />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted ml-1">Target Asset</label>
              <select 
                value={manualCurrency}
                onChange={(e) => { setManualCurrency(e.target.value); setRate(null); }}
                className="w-full h-12 rounded-xl border-2 border-border bg-background px-4 text-sm font-bold focus:border-black outline-none transition-all"
              >
                 <option value="">Auto-detect</option>
                 {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
           </div>
        </section>

        <section className="rounded-2xl border-2 border-foreground bg-background p-6 shadow-xl space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <Landmark size={16} className="text-foreground" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Safe Daily Spend</span>
              </div>
              <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
           </div>
           
           <div className="space-y-1">
              <p className="text-3xl font-black tracking-tighter text-foreground">
                {convertedDaily ? `${convertedDaily.toFixed(0)} ${effectiveCurrency}` : "FX PENDING"}
              </p>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                ≈ {formatCurrency(dailySpend, baseCurrency)} / day
              </p>
           </div>

           <div className="pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <div className="flex items-center gap-1.5 text-muted">
                    <Coins size={10} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Cash (30%)</span>
                 </div>
                 <p className="text-xs font-black">{convertedDaily ? (convertedDaily * 0.3).toFixed(0) : "-"} {effectiveCurrency}</p>
              </div>
              <div className="space-y-1">
                 <div className="flex items-center gap-1.5 text-muted">
                    <CreditCard size={10} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Card (70%)</span>
                 </div>
                 <p className="text-xs font-black">{convertedDaily ? (convertedDaily * 0.7).toFixed(0) : "-"} {effectiveCurrency}</p>
              </div>
           </div>
        </section>

        {rate && (
          <div className="p-4 rounded-xl bg-surface-2/50 border border-border space-y-2">
             <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted">Status</span>
                <span className="text-[8px] font-bold text-emerald-600 uppercase">Live</span>
             </div>
             <p className="text-[10px] font-medium leading-relaxed text-muted-2">
                1 {baseCurrency} = {rate.rate.toFixed(4)} {effectiveCurrency}. 
                Refreshed {rate.date || "recently"} via Frankfurter API protocols.
             </p>
          </div>
        )}
      </aside>

      {/* 2. Main Converter Stage */}
      <main className="flex-1 p-6 lg:p-16 space-y-12 lg:overflow-y-auto scrollbar-hide">
         <div className="max-w-2xl mx-auto space-y-12">
            <section className="space-y-8">
               <div className="grid gap-8 sm:grid-cols-2 relative">
                  <div className="space-y-4">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-2">Source Amount</span>
                     <div className="relative">
                        <Input 
                          value={baseAmount}
                          onChange={(e) => handleBaseChange(e.target.value)}
                          className="h-20 rounded-2xl border-2 border-border bg-surface px-6 text-3xl font-black tracking-tighter focus:border-black transition-all"
                          type="number"
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-muted">{baseCurrency}</span>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-2">Target Tactical</span>
                     <div className="relative">
                        <Input 
                          value={targetAmount}
                          onChange={(e) => handleTargetChange(e.target.value)}
                          className="h-20 rounded-2xl border-2 border-foreground bg-background px-6 text-3xl font-black tracking-tighter shadow-xl focus:border-foreground"
                          type="number"
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-foreground">{effectiveCurrency}</span>
                     </div>
                  </div>
                  
                  <div className="hidden sm:grid absolute left-1/2 top-[72px] -translate-x-1/2 size-10 place-items-center rounded-full bg-foreground text-background shadow-xl z-10 border-4 border-background">
                     <Zap size={18} fill="currentColor" />
                  </div>
               </div>

               <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {presets.map(p => (
                    <button 
                      key={p}
                      onClick={() => handleBaseChange(p.toString())}
                      className="h-9 px-4 rounded-lg border border-border bg-surface text-[10px] font-black uppercase tracking-widest text-muted hover:border-black hover:text-black transition-all active:scale-95"
                    >
                       {p} {baseCurrency}
                    </button>
                  ))}
               </div>
            </section>

            <section className="grid gap-6 sm:grid-cols-3">
               <ConversionCard label="Local Meal" estimate={20 * (rate?.rate || 1)} currency={effectiveCurrency || ""} />
               <ConversionCard label="Daily Transport" estimate={15 * (rate?.rate || 1)} currency={effectiveCurrency || ""} />
               <ConversionCard label="Major Sight" estimate={25 * (rate?.rate || 1)} currency={effectiveCurrency || ""} />
            </section>

            <div className="rounded-2xl bg-foreground p-8 text-background shadow-2xl space-y-6 overflow-hidden relative">
               <TrendingUp size={120} className="absolute -right-8 -bottom-8 text-background/5 rotate-12" />
               <div className="relative z-10 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-background/50">Market Intelligence</h3>
                  <p className="text-xl font-medium leading-relaxed max-w-[40ch]">
                     Your purchasing power in <span className="text-emerald-400">{effectiveCurrency}</span> is calculated based on interbank mid-market rates. 
                     Deployment in local markets should account for a 2-3% spread at physical exchanges.
                  </p>
               </div>
            </div>
         </div>
      </main>
    </div>
  );
}

function ConversionCard({ label, estimate, currency }: { label: string, estimate: number, currency: string }) {
  return (
    <div className="p-5 rounded-xl border border-border bg-surface shadow-sm">
       <span className="text-[8px] font-black uppercase tracking-widest text-muted block mb-3">{label}</span>
       <p className="text-lg font-black tracking-tight">{estimate.toFixed(0)} {currency}</p>
    </div>
  );
}
