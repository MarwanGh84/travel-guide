"use client";

import { useState } from "react";
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
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { addBooking, deleteBooking } from "@/app/actions";

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
};

type BookingsWorkspaceProps = {
  bookings: Booking[];
  tripName: string;
};

export function BookingsWorkspace({ bookings, tripName }: BookingsWorkspaceProps) {
  const [filterType, setFilterType] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);

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

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* Header Command Area */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
        <div className="flex items-center gap-8">
           <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black tracking-widest text-muted uppercase">Inventory Pool</span>
              <span className="text-xl font-bold tracking-tight">{bookings.length} Records</span>
           </div>
           <div className="h-8 w-px bg-border/50" />
           <div className="flex items-center gap-3">
              <Filter size={12} className="text-muted" />
              <div className="flex gap-1">
                 {["all", "Flight", "Hotel", "Restaurant"].map(type => (
                   <button 
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={cn(
                        "h-7 rounded-md px-3 text-[10px] font-bold uppercase tracking-wider transition-all",
                        filterType === type ? "bg-black text-white" : "text-muted hover:bg-surface-2"
                      )}
                   >
                      {type}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        <div className="flex items-center gap-3">
           <button 
              onClick={exportCsv}
              className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-4 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-black transition-all shadow-sm"
           >
              <Download size={12} /> Export CSV
           </button>
           <Link href="/imports">
              <button className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-4 text-[10px] font-bold uppercase tracking-widest text-foreground hover:bg-surface transition-all shadow-sm">
                 <Mail size={12} /> Gmail Sync
              </button>
           </Link>
           <button
             onClick={() => setShowAddForm((current) => !current)}
             className="flex h-9 items-center gap-2 rounded-md bg-black px-4 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-zinc-800 transition-all shadow-xl"
           >
              <Plus size={12} /> New Record
           </button>
        </div>
      </header>

      {showAddForm && (
        <form
          action={async (formData) => {
            await addBooking(formData);
            setShowAddForm(false);
          }}
          className="grid shrink-0 gap-3 border-b border-border bg-background px-6 py-4 md:grid-cols-4"
        >
          <select name="type" defaultValue="Flight" className="h-9 rounded-md border border-border bg-surface px-3 text-xs">
            {["Flight", "Hotel", "Restaurant", "Tour", "Car rental"].map((type) => <option key={type}>{type}</option>)}
          </select>
          <input name="title" required placeholder="Title" className="h-9 rounded-md border border-border bg-surface px-3 text-xs" />
          <input name="provider" placeholder="Provider" className="h-9 rounded-md border border-border bg-surface px-3 text-xs" />
          <input name="confirmationNumber" placeholder="Confirmation #" className="h-9 rounded-md border border-border bg-surface px-3 text-xs" />
          <input name="startAt" type="date" required className="h-9 rounded-md border border-border bg-surface px-3 text-xs" />
          <input name="endAt" type="date" className="h-9 rounded-md border border-border bg-surface px-3 text-xs" />
          <input name="link" placeholder="Link" className="h-9 rounded-md border border-border bg-surface px-3 text-xs" />
          <input name="notes" placeholder="Notes" className="h-9 rounded-md border border-border bg-surface px-3 text-xs" />
          <div className="md:col-span-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowAddForm(false)} className="h-9 rounded-md border border-border px-4 text-[10px] font-bold uppercase tracking-widest text-muted">Cancel</button>
            <button type="submit" className="h-9 rounded-md bg-black px-4 text-[10px] font-bold uppercase tracking-widest text-white">Save Booking</button>
          </div>
        </form>
      )}

      {/* Main Ledger Stage */}
      <main className="flex-1 overflow-y-auto">
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
                        <div className="grid size-8 place-items-center rounded-lg bg-surface-2 border border-border text-muted">
                           <Icon size={14} />
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-foreground">{b.title}</span>
                           <span className="text-[10px] uppercase font-bold tracking-widest text-muted mt-0.5">{b.type}</span>
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
                           <span className="text-[10px] font-mono font-bold text-muted bg-surface-2 px-1.5 py-0.5 rounded border border-border">
                              {b.confirmationNumber || "NO_REF"}
                           </span>
                           {b.link && (
                             <a href={b.link} target="_blank" className="text-muted hover:text-black transition-colors">
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
              {filtered.length === 0 && (
                <tr>
                   <td colSpan={6} className="py-20 text-center opacity-40">
                      <Search size={32} className="mx-auto mb-4" strokeWidth={1} />
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em]">No records found</p>
                   </td>
                </tr>
              )}
           </tbody>
        </table>
      </main>

      {/* Status Rail */}
      <footer className="flex h-10 shrink-0 items-center justify-between border-t border-border bg-surface px-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted">
         <div className="flex items-center gap-4">
            <span>SYNC STATUS: OPERATIONAL</span>
            <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
         </div>
         <div className="flex items-center gap-6">
            <span>ACTIVE TRIP: {tripName}</span>
            <span>PRESS / FOR SEARCH</span>
         </div>
      </footer>
    </div>
  );
}
