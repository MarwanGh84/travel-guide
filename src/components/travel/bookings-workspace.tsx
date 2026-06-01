"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  Ticket, 
  Plane, 
  Hotel, 
  Utensils, 
  Car,
  Mail,
  Search,
  Filter,
  LucideIcon,
  Download,
  ShieldCheck,
  Sparkles,
  FileText,
  User,
  Wifi,
  Coins,
  CheckCircle2,
  Clock,
  XCircle,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addBooking, deleteBooking, updateChecklistItemStatus, fetchFlightTelemetry } from "@/app/actions";
import type { FlightTelemetry } from "@/lib/api/flightService";

type Booking = {
  id: string;
  title: string;
  type: string;
  provider?: string | null;
  confirmationNumber?: string | null;
  date?: string;
  endDate?: string;
  link?: string | null;
  notes?: string | null;
  importGroupId?: string | null;
};

type BookingChecklistItem = {
  id: string;
  key: string;
  label: string;
  status: string;
  notes?: string | null;
};

type BookingsWorkspaceProps = {
  bookings: Booking[];
  tripName: string;
  checklist: BookingChecklistItem[];
  itineraryApproved: boolean;
};

export function BookingsWorkspace({ bookings, tripName, checklist, itineraryApproved }: BookingsWorkspaceProps) {
  const router = useRouter();
  const [filterType, setFilterType] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showChecklist, setShowChecklist] = useState(true);
  const [telemetry, setTelemetry] = useState<Record<string, FlightTelemetry>>({});

  useEffect(() => {
    const flights = bookings.filter(b => b.type === "Flight" && b.date);
    console.log(`[BookingsWorkspace] Found ${flights.length} flights to track.`);
    
    flights.forEach(async (flight) => {
       if (flight.date) {
         console.log(`[BookingsWorkspace] Syncing telemetry for: ${flight.title} on ${flight.date}`);
         const res = await fetchFlightTelemetry(flight.title, flight.date);
         if (res.ok && res.data) {
            console.log(`[BookingsWorkspace] Received telemetry for ${flight.id}:`, res.data);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setTelemetry(prev => ({ ...prev, [flight.id]: res.data as any }));
         } else {
            console.warn(`[BookingsWorkspace] No telemetry found or error for ${flight.id}:`, res.message);
         }
       }
    });
  }, [bookings]);

  const icons: Record<string, LucideIcon> = {
    Flight: Plane,
    Hotel: Hotel,
    Restaurant: Utensils,
    Tour: Ticket,
    "Car rental": Car,
  };

  const filtered = bookings.filter(b => filterType === "all" || b.type === filterType);

  const exportCsv = () => {
    const data = "Title,Type,Provider,Date,Confirmation\n" + filtered.map(b => `${b.title},${b.type},${b.provider || ''},${b.date || ''},${b.confirmationNumber || ''}`).join("\n");
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${tripName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const checklistCompleted = checklist.filter(item => item.status === "done" || item.status === "not_needed").length;
  const stayBookingMissing = itineraryApproved && !checklist.find(item => item.key === "stay" && (item.status === "done" || item.status === "not_needed"));

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto lg:overflow-hidden bg-background">
      {/* Header Command Area */}
      <header className="flex h-auto shrink-0 flex-col gap-6 border-b border-border bg-surface px-6 py-4 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
           <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black tracking-widest text-muted uppercase">Inventory</span>
              <span className="text-xl font-bold tracking-tight">{bookings.length} Records</span>
           </div>
           <div className="hidden h-8 w-px bg-border/50 sm:block" />
           <div className="flex items-center gap-3">
              <Filter size={12} className="text-muted" />
              <div className="flex gap-1 overflow-x-auto no-scrollbar scrollbar-hide">
                 {["all", "Flight", "Hotel", "Restaurant"].map(type => (
                   <button 
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={cn(
                        "h-7 rounded-md px-3 text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                        filterType === type ? "bg-foreground text-background" : "text-muted hover:bg-surface-2"
                      )}
                   >
                      {type}
                   </button>
                 ))}
              </div>
           </div>
           <div className="hidden h-8 w-px bg-border/50 sm:block" />
           <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowChecklist(!showChecklist)}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-md px-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm",
                  showChecklist ? "bg-foreground text-background" : "bg-surface-2 text-muted hover:bg-border"
                )}
              >
                Checklist {checklistCompleted}/{checklist.length}
              </button>
           </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
              onClick={exportCsv}
              className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground hover:border-foreground transition-all active:scale-95 sm:flex-none"
           >
              <Download size={12} /> <span className="hidden xs:inline">CSV</span>
           </button>
           <Link href="/imports" className="flex-1 sm:flex-none">
              <button className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-surface transition-all active:scale-95">
                 <Mail size={12} /> <span className="hidden xs:inline">Sync</span><span className="xs:hidden">Sync</span>
              </button>
           </Link>
           <button
             onClick={() => setShowAddForm((current: boolean) => !current)}
             className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-[10px] font-black uppercase tracking-widest text-background hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 sm:flex-none shadow-lg"
           >
              <Plus size={12} /> <span className="hidden xs:inline">New Record</span><span className="xs:hidden">Add</span>
           </button>
        </div>
      </header>

      {stayBookingMissing && (
        <div className="bg-rose-50 border-b border-rose-100 px-6 py-3 flex items-center gap-3">
          <div className="size-2 rounded-full bg-rose-500 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">
            Itinerary approved but Hotel / Stay booking is still marked as needed.
          </p>
        </div>
      )}

      {showChecklist && checklist.length > 0 && (
        <section className="shrink-0 border-b border-border bg-surface/30 p-2 overflow-x-auto no-scrollbar scrollbar-hide">
          <div className="flex items-center gap-2 min-w-max px-4 h-16">
            <div className="flex flex-col gap-0.5 pr-4 border-r border-border shrink-0">
               <span className="text-[8px] font-black uppercase tracking-widest text-muted">Readiness</span>
               <span className="text-[10px] font-black uppercase text-foreground">{checklistCompleted} / {checklist.length}</span>
            </div>
            {checklist.map((item) => {
              const ItemIcon = {
                flights: Plane,
                stay: Hotel,
                transfer: Car,
                insurance: ShieldCheck,
                activities: Sparkles,
                restaurants: Utensils,
                car: Car,
                visa: FileText,
                passport: User,
                sim: Wifi,
                money: Coins
              }[item.key] || Ticket;

              return (
                <div key={item.id} className="group relative flex items-center gap-3 rounded-lg border border-border bg-background p-2 transition-all hover:border-foreground shadow-sm h-12">
                   <div className={cn(
                     "grid size-8 place-items-center rounded-md border",
                     item.status === "done" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                     item.status === "not_needed" ? "bg-surface-2 text-muted border-border/50" :
                     "bg-surface-2 text-muted border-border"
                   )}>
                      <ItemIcon size={14} />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-tight text-foreground truncate max-w-[80px]">{item.label}</span>
                      <div className="flex gap-1.5 mt-1">
                         {[
                           { val: "needed", icon: Clock, color: "text-amber-500" },
                           { val: "done", icon: CheckCircle2, color: "text-emerald-500" },
                           { val: "not_needed", icon: XCircle, color: "text-muted-foreground/30" }
                         ].map((s) => (
                           <button
                             key={s.val}
                             onClick={async () => {
                               const formData = new FormData();
                               formData.set("itemId", item.id);
                               formData.set("status", s.val);
                               await updateChecklistItemStatus(formData);
                               router.refresh();
                             }}
                             className={cn(
                               "transition-all active:scale-90",
                               item.status === s.val ? s.color : "opacity-20 hover:opacity-100"
                             )}
                             title={s.val}
                           >
                              <s.icon size={10} />
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {showAddForm && (
        <form
          action={async (formData) => {
            await addBooking(formData);
            setShowAddForm(false);
            router.refresh();
          }}
          className="grid shrink-0 gap-3 border-b border-border bg-background px-6 py-4 md:grid-cols-4"
        >
          <select name="type" defaultValue="Flight" className="h-10 rounded-md border border-border bg-surface px-3 text-sm md:h-9 md:text-xs">
            {["Flight", "Hotel", "Restaurant", "Tour", "Car rental"].map((type) => <option key={type}>{type}</option>)}
          </select>
          <input name="title" required placeholder="Title" className="h-10 rounded-md border border-border bg-surface px-3 text-sm md:h-9 md:text-xs" />
          <input name="provider" placeholder="Provider" className="h-10 rounded-md border border-border bg-surface px-3 text-sm md:h-9 md:text-xs" />
          <input name="confirmationNumber" placeholder="Confirmation #" className="h-10 rounded-md border border-border bg-surface px-3 text-sm md:h-9 md:text-xs" />
          <input name="startAt" type="date" required className="h-10 rounded-md border border-border bg-surface px-3 text-sm md:h-9 md:text-xs" />
          <input name="endAt" type="date" className="h-10 rounded-md border border-border bg-surface px-3 text-sm md:h-9 md:text-xs" />
          <input name="link" placeholder="Link" className="h-10 rounded-md border border-border bg-surface px-3 text-sm md:h-9 md:text-xs" />
          <input name="notes" placeholder="Notes" className="h-10 rounded-md border border-border bg-surface px-3 text-sm md:h-9 md:text-xs" />
          <div className="md:col-span-4 flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setShowAddForm(false)} className="h-9 flex-1 rounded-md border border-border px-4 text-[10px] font-bold uppercase tracking-widest text-muted md:flex-none">Cancel</button>
            <button type="submit" className="h-9 flex-1 rounded-md bg-foreground px-4 text-[10px] font-black uppercase tracking-widest text-background md:flex-none">Save Record</button>
          </div>
        </form>
      )}

      {/* Main Ledger Stage */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="hidden sm:block">
          <table className="w-full border-collapse text-left">
             <thead>
                <tr className="sticky top-0 z-10 border-b border-border bg-surface text-[10px] font-black uppercase tracking-[0.1em] text-muted">
                   <th className="px-6 py-3 font-black w-12"></th>
                   <th className="px-6 py-3 font-black">Confirmation Title</th>
                   <th className="px-6 py-3 font-black">Provider</th>
                   <th className="px-6 py-3 font-black">Schedule</th>
                   <th className="px-6 py-3 font-black">Reference</th>
                   <th className="w-12 px-6 py-3 text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-border/40">
                {filtered.map((b) => {
                  const Icon = icons[b.type] || Ticket;
                  return (
                    <tr key={b.id} className="group hover:bg-surface/50 transition-colors cursor-default">
                       <td className="px-6 py-4">
                          <div className="grid size-8 place-items-center rounded-lg bg-surface-2 border border-border text-foreground">
                             <Icon size={14} />
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex flex-col">
                             <span className="text-xs font-bold text-foreground">{b.title}</span>
                             <span className="text-[10px] uppercase font-bold tracking-widest text-muted mt-0.5">
                               {b.type}{b.importGroupId ? " · Gmail imported" : ""}
                             </span>
                             {telemetry[b.id] && (
                               <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <div className={cn(
                                    "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest",
                                    telemetry[b.id].status.toLowerCase().includes("delayed") ? "bg-rose-500/10 text-rose-600 dark:text-rose-500 border border-rose-500/20" : 
                                    telemetry[b.id].status.toLowerCase().includes("landed") ? "bg-zinc-500/10 text-zinc-600 dark:text-zinc-500 border border-zinc-500/20" :
                                    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20"
                                  )}>
                                     <Activity size={10} className="animate-pulse" />
                                     {telemetry[b.id].status}
                                  </div>
                                  <span className="text-[8px] font-black uppercase tracking-widest text-muted">
                                     {telemetry[b.id].departure.airport} → {telemetry[b.id].arrival.airport}
                                  </span>
                                  {(telemetry[b.id].departure.terminal || telemetry[b.id].departure.gate) && (
                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted/60 border-l border-border pl-2">
                                       Gate {telemetry[b.id].departure.gate || "TBD"} (T{telemetry[b.id].departure.terminal || "---"})
                                    </span>
                                  )}
                               </div>
                             )}
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          <span className="text-xs font-medium text-muted">{b.provider || "N/A"}</span>
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex flex-col">
                             <span className="text-xs font-bold text-foreground">{b.date || "PENDING"}</span>
                             {b.endDate && <span className="text-[9px] text-muted font-bold">ENDS {b.endDate}</span>}
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] font-mono font-bold text-muted bg-surface-3 px-1.5 py-0.5 rounded border border-border">
                                {b.confirmationNumber || "NO_REF"}
                             </span>
                             {b.link && (
                               <a href={b.link} target="_blank" className="text-muted hover:text-foreground transition-colors">
                                  <ExternalLink size={12} />
                               </a>
                             )}
                          </div>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <form action={deleteBooking}>
                             <input type="hidden" name="bookingId" value={b.id} />
                             <button className="opacity-0 group-hover:opacity-100 p-2 text-muted hover:text-rose-600 transition-all">
                                <Trash2 size={14} />
                             </button>
                          </form>
                       </td>
                    </tr>
                  );
                })}
             </tbody>
          </table>
        </div>

        {/* Mobile Booking Cards */}
        <div className="space-y-4 p-4 sm:hidden">
           {filtered.map((b) => {
              const Icon = icons[b.type] || Ticket;
              return (
                <div key={b.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                         <div className="grid size-8 place-items-center rounded-lg bg-background border border-border text-foreground">
                            <Icon size={14} />
                         </div>
                         <div className="min-w-0">
                            <span className="block text-xs font-black uppercase tracking-tight text-foreground truncate">{b.title}</span>
                            <span className="text-[8px] font-bold uppercase tracking-widest text-muted">{b.type}</span>
                         </div>
                      </div>
                      <form action={deleteBooking}>
                         <input type="hidden" name="bookingId" value={b.id} />
                         <button className="p-2 text-muted hover:text-rose-600 transition-colors">
                            <Trash2 size={14} />
                         </button>
                      </form>
                   </div>
                   <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                         <p className="text-[8px] font-black uppercase tracking-widest text-muted mb-1">Provider</p>
                         <p className="text-[10px] font-bold text-foreground truncate">{b.provider || "N/A"}</p>
                      </div>
                      <div>
                         <p className="text-[8px] font-black uppercase tracking-widest text-muted mb-1">Schedule</p>
                         <p className="text-[10px] font-black text-foreground">{b.date || "PENDING"}</p>
                      </div>
                   </div>
                   <div className="flex items-center justify-between border-t border-border/40 pt-4">
                      <div className="flex items-center gap-2">
                         <span className="text-[9px] font-mono font-bold text-muted bg-background px-2 py-0.5 rounded border border-border">
                            {b.confirmationNumber || "NO_REF"}
                         </span>
                         {b.link && (
                            <a href={b.link} target="_blank" className="p-1.5 rounded-md bg-background border border-border text-foreground">
                               <ExternalLink size={10} />
                            </a>
                         )}
                      </div>
                      {b.importGroupId && (
                         <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                            <Mail size={8} /> GMAIL SYNCED
                         </span>
                      )}
                   </div>
                </div>
              );
           })}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center opacity-40 px-6">
             <Search size={32} className="mx-auto mb-4" strokeWidth={1} />
             <p className="text-[10px] font-bold uppercase tracking-[0.2em]">No records found</p>
          </div>
        )}
      </main>

      {/* Status Rail */}
      <footer className="flex h-auto shrink-0 flex-col gap-4 border-t border-border bg-surface px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted sm:h-10 sm:flex-row sm:items-center sm:justify-between sm:py-0">
         <div className="flex items-center gap-4">
            <span className="whitespace-nowrap">SYNC: OPERATIONAL</span>
            <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
         </div>
         <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="whitespace-nowrap">TRIP: {tripName}</span>
            <span className="text-foreground whitespace-nowrap">USER: @marwanghostine</span>
         </div>
      </footer>
    </div>
  );

}
