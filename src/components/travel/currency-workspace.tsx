"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Info, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type ExchangeRateData = {
  base: string;
  quote: string;
  rate: number;
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

const currencyOptions = ["AED", "USD", "EUR", "GBP", "JPY", "LBP", "TRY", "IDR", "CHF"];

export function CurrencyWorkspace({ baseCurrency, targetCurrency, initialRate, tripBudget, tripDuration }: CurrencyWorkspaceProps) {
  const [manualCurrency, setManualCurrency] = useState(targetCurrency ?? "");
  const [rate, setRate] = useState<ExchangeRateData | null>(initialRate);
  const [baseAmount, setBaseAmount] = useState("100");
  const effectiveCurrency = (targetCurrency ?? manualCurrency) || null;
  const [targetAmount, setTargetAmount] = useState(initialRate ? (100 * initialRate.rate).toFixed(2) : "");

  useEffect(() => {
    if (!effectiveCurrency || (rate && rate.quote === effectiveCurrency)) return;
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
  }, [baseAmount, baseCurrency, effectiveCurrency, rate]);

  const dailySpend = tripDuration > 0 ? tripBudget / tripDuration : 0;
  const hasLiveRate = Boolean(rate && !rate.source.isMock && rate.rate > 0);
  const convertedBudget = hasLiveRate ? tripBudget * rate!.rate : null;
  const convertedDaily = hasLiveRate ? dailySpend * rate!.rate : null;
  const classification = targetCurrency ? "Detected from trip country" : manualCurrency ? "Manual user selection" : "Currency not detected";

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

  const statusText = useMemo(() => {
    if (!effectiveCurrency) return "Currency not detected. Select one manually to enable conversion.";
    if (!rate || rate.source.isMock || rate.rate <= 0) return rate?.source.note ?? "Exchange rate unavailable.";
    return `Frankfurter live rate: 1 ${baseCurrency} = ${rate.rate.toFixed(6)} ${effectiveCurrency}`;
  }, [baseCurrency, effectiveCurrency, rate]);

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:overflow-hidden bg-background">
      <aside className="space-y-6 p-6 lg:overflow-y-auto lg:border-r lg:border-border lg:bg-surface">
        <section className="rounded-xl border border-border bg-surface sm:bg-background lg:bg-background p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted">Destination currency</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-foreground">{effectiveCurrency ?? "Not detected"}</h1>
          <p className="mt-3 text-[9px] font-bold uppercase tracking-wide text-muted">{classification}</p>
          {!targetCurrency && (
            <label className="mt-5 block text-[10px] font-bold uppercase tracking-wide text-muted">
              Manual selection
              <select
                value={manualCurrency}
                onChange={(event) => {
                  setManualCurrency(event.target.value);
                  setRate(null);
                }}
                className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="">Choose currency</option>
                {currencyOptions.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </select>
            </label>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface sm:bg-background lg:bg-background p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Exchange source</span>
            <span className="text-[9px] font-bold uppercase text-muted">{hasLiveRate ? "Real provider data" : "Unavailable"}</span>
          </div>
          <p className="text-xs leading-relaxed text-muted uppercase font-medium">{statusText}</p>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-surface sm:bg-background lg:bg-background p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Info size={12} className="text-muted" />
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Trip money notes</span>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
             <StrategyNode label="Daily estimate" value={formatCurrency(dailySpend, baseCurrency)} note={convertedDaily ? `${convertedDaily.toFixed(0)} ${effectiveCurrency}` : "FX MISSING"} />
             <StrategyNode label="Trip budget" value={formatCurrency(tripBudget, baseCurrency)} note={convertedBudget ? `${convertedBudget.toFixed(0)} ${effectiveCurrency}` : "FX MISSING"} />
             <div className="col-span-2 lg:col-span-1">
                <StrategyNode label="Reminder" value="Local cash focus" note="Keep small bills for vendors" />
             </div>
          </div>
        </section>
      </aside>

      <main className="flex-1 p-6 sm:p-12 lg:overflow-y-auto lg:p-24 scrollbar-hide">
        <header className="mb-10 sm:mb-16">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Currency converter</span>
          <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-foreground uppercase">Travel exchange</h2>
        </header>

        <div className="relative max-w-xl space-y-12 sm:space-y-8">
          <Field label={`From ${baseCurrency}`} value={baseAmount} onChange={handleBaseChange} disabled={!hasLiveRate} />
          <div className="absolute left-1/2 top-[108px] sm:top-[92px] grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black text-white shadow-xl z-10 border-4 border-background sm:border-none">
            <ArrowRightLeft size={18} />
          </div>
          <Field label={`To ${effectiveCurrency ?? "destination currency"}`} value={targetAmount} onChange={handleTargetChange} disabled={!hasLiveRate} />
        </div>

        <div className="mt-12 sm:mt-16 rounded-2xl border border-border bg-surface p-6 sm:p-8 text-xs font-bold uppercase tracking-widest text-muted shadow-inner">
          <div className="flex items-start gap-4">
            <TrendingUp size={16} className="mt-0.5 shrink-0 text-black" />
            <p className="leading-relaxed">{hasLiveRate ? "Rate is provider-backed and refreshed from Frankfurter." : "No conversion is shown until a valid provider rate is available."}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean }) {
  return (
    <label className="block space-y-4">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</span>
      <Input 
         value={value} 
         onChange={(event) => onChange(event.target.value)} 
         type="number" 
         disabled={disabled} 
         className="h-20 sm:h-24 rounded-2xl border-border bg-surface px-6 text-3xl sm:text-5xl font-black tracking-tighter shadow-sm focus:ring-black" 
      />
    </label>
  );
}

function StrategyNode({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <span className="text-[8px] font-black uppercase tracking-widest text-muted">{label}</span>
      <p className="mt-1 truncate text-sm font-bold text-foreground">{value}</p>
      <p className="mt-1 text-[10px] font-medium text-muted">{note}</p>
    </div>
  );
}
