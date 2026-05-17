"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { 
  CloudSun, 
  MapPin, 
  Calendar, 
  Users, 
  Wallet, 
  Sparkles, 
  Ticket, 
  Clock,
  LucideIcon
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";

type TripStatus = {
  destination: string | null;
  country: string | null;
  startDate: string | null;
  endDate: string | null;
  duration: number;
  travelerCount: number;
  budget: number;
  savedPlacesCount: number;
  bookingCount: number;
  itineraryStatus: string;
  currency?: string | null;
  weather?: {
    temp: string;
    label: string;
  } | null;
  exchangeRate?: string | null;
};

export function TripStatusBar() {
  const pathname = usePathname();
  const [data, setData] = useState<TripStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/ai/summary", { cache: "no-store" });
      const result = await response.json();
      setData(result.ok && result.trip ? result.trip : null);
    } catch (error) {
      console.error("Failed to fetch trip status", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchStatus, pathname]);

  useEffect(() => {
    window.addEventListener("trip-status-refresh", fetchStatus);
    return () => window.removeEventListener("trip-status-refresh", fetchStatus);
  }, [fetchStatus]);

  if (loading) return <div className="h-10 border-b border-border bg-surface/50 animate-pulse" />;
  if (!data) return (
    <div className="flex h-10 items-center justify-center border-b border-border bg-surface px-6 text-[10px] font-black uppercase tracking-widest text-muted">
       No active trip selected
    </div>
  );

  const tickerItems = (
    <div className="flex items-center gap-12 whitespace-nowrap px-6">
       <StatusItem icon={MapPin} label="Destination" value={`${data.destination || 'TBD'}, ${data.country || 'Global'}`} bold />
       <Divider />
       <StatusItem icon={Calendar} label="Window" value={`${data.startDate} — ${data.endDate} (${data.duration} days)`} />
       <Divider />
       <StatusItem icon={Users} label="Group" value={`${data.travelerCount} traveler${data.travelerCount > 1 ? 's' : ''}`} />
       <Divider />
       <StatusItem icon={Wallet} label="Budget" value={formatCurrency(data.budget)} />
       <Divider />
       {data.currency && (
         <>
           <StatusItem icon={Wallet} label="Currency" value={data.currency} />
           <Divider />
         </>
       )}
       {data.weather && (
         <>
           <StatusItem icon={CloudSun} label="Climate" value={`${data.weather.temp} ${data.weather.label}`} />
           <Divider />
         </>
       )}
       <StatusItem icon={Sparkles} label="Curation" value={`${data.savedPlacesCount} saved`} />
       <Divider />
       <StatusItem icon={Ticket} label="Logistics" value={`${data.bookingCount} records`} />
       <Divider />
       <StatusItem icon={Clock} label="Status" value={data.itineraryStatus} highlight />
    </div>
  );

  return (
    <div className="group relative flex h-10 w-full items-center overflow-hidden border-b border-border bg-surface select-none z-20">
       {/* Gradient Masks - strictly decorative and non-blocking */}
       <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-surface via-surface/80 to-transparent" />
       <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-surface via-surface/80 to-transparent" />

       {/* Continuous Marquee Wrapper */}
       <div className="flex w-fit">
          <motion.div
            initial={{ x: "-50%" }}
            animate={{ x: "0%" }}
            transition={{
              repeat: Infinity,
              duration: 40, // Slower, more premium pace
              ease: "linear",
            }}
            className="flex shrink-0 items-center"
          >
            {tickerItems}
            {tickerItems}
          </motion.div>
       </div>
    </div>
  );
}

function StatusItem({ icon: Icon, label, value, bold = false, highlight = false }: { icon: LucideIcon, label: string, value: string, bold?: boolean, highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
       <Icon size={12} className={cn(highlight ? "text-emerald-600" : "text-muted-foreground/70")} />
       <div className="flex items-baseline gap-1.5">
          <span className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/50">{label}:</span>
          <span className={cn("text-[10px] uppercase tracking-tight", bold ? "font-black text-foreground" : "font-bold text-muted-foreground")}>
            {value}
          </span>
       </div>
    </div>
  );
}

function Divider() {
  return <div className="h-3 w-px bg-border/60 shrink-0" />;
}
