"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  MapPinned, 
  Compass, 
  CalendarDays, 
  Wallet, 
  Settings2, 
  Bell, 
  User,
  History,
  FileText,
  Ticket,
  LucideIcon,
  Clock,
  Bookmark,
  Menu,
  X,
  CircleDollarSign,
  Bed
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { TripStatusBar } from "@/components/travel/trip-status-bar";

const primaryNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/today", label: "Today", icon: Clock },
  { href: "/trips", label: "Trips", icon: History },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/itinerary", label: "Itinerary", icon: CalendarDays },
  { href: "/stays", label: "Stays", icon: Bed },
  { href: "/map", label: "Map", icon: MapPinned },
];

const secondaryNav = [
  { href: "/bookings", label: "Bookings", icon: Ticket },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/currency", label: "Currency", icon: CircleDollarSign },
  { href: "/imports", label: "Imports", icon: Bell },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/memories", label: "Memories", icon: Bookmark },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div 
      className="flex h-screen w-screen overflow-hidden font-sans selection:bg-black selection:text-white relative"
      style={{
        backgroundColor: '#f4f1ea',
        backgroundImage: `
          radial-gradient(at 27% 37%, hsla(45, 30%, 95%, 1) 0px, transparent 50%),
          radial-gradient(at 97% 21%, hsla(38, 25%, 92%, 1) 0px, transparent 50%),
          radial-gradient(at 52% 99%, hsla(42, 28%, 94%, 1) 0px, transparent 50%),
          radial-gradient(at 10% 29%, hsla(48, 20%, 96%, 1) 0px, transparent 50%),
          radial-gradient(at 97% 96%, hsla(35, 22%, 91%, 1) 0px, transparent 50%),
          radial-gradient(at 33% 50%, hsla(40, 24%, 93%, 1) 0px, transparent 50%),
          radial-gradient(at 79% 53%, hsla(44, 26%, 95%, 1) 0px, transparent 50%)
        `,
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Navigation Rail / Drawer */}
      <aside className={cn(
        "group fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-border bg-surface/95 backdrop-blur-lg transition-all duration-300 lg:w-[64px] lg:translate-x-0 lg:hover:w-[240px] lg:shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex h-14 shrink-0 items-center justify-between px-4 lg:h-12">
          <div className="flex items-center">
            <div className="grid size-8 shrink-0 place-items-center rounded bg-black text-white shadow-sm">
              <MapPinned size={18} />
            </div>
            <span className="ml-3 overflow-hidden truncate text-[11px] font-black tracking-[0.1em] lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100 uppercase">
              Travel Workstation
            </span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden hover:bg-surface-2 p-2 rounded-md transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-2 overflow-y-auto scrollbar-hide pb-20 lg:pb-0">
          {primaryNav.map((item) => (
            <NavItem key={item.href} {...item} active={pathname === item.href} onClick={() => setMobileMenuOpen(false)} />
          ))}
          
          <div className="my-6 h-px bg-border mx-2 opacity-50" />
          
          {secondaryNav.map((item) => (
            <NavItem key={item.href} {...item} active={pathname === item.href} onClick={() => setMobileMenuOpen(false)} />
          ))}
        </nav>

        <div className="mt-auto mb-4 space-y-1 px-2 shrink-0 border-t border-border pt-4 lg:border-none lg:pt-0">
          <NavItem href="/profile" label="Profile" icon={User} active={pathname === "/profile"} onClick={() => setMobileMenuOpen(false)} />
          <NavItem href="/integrations" label="Settings" icon={Settings2} active={pathname === "/integrations"} onClick={() => setMobileMenuOpen(false)} />
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex flex-1 flex-col overflow-hidden relative lg:pl-[64px]">
        {/* Command Bar / Global Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 z-30 lg:h-12">
          <div className="flex items-center gap-3 text-muted-foreground min-w-0">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="grid size-9 place-items-center rounded hover:bg-surface-2 transition-colors lg:hidden shrink-0"
            >
              <Menu size={22} />
            </button>
            <div className="hidden items-center gap-2 lg:flex">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] opacity-40">System</span>
              <span className="text-border">/</span>
            </div>
            <span className="text-[11px] font-bold text-foreground truncate uppercase tracking-wide lg:text-[12px]">
              {pathname === "/" ? "Dashboard" : pathname.split("/").filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" / ")}
            </span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="grid size-8 place-items-center rounded hover:bg-surface-2 transition-colors">
              <Bell size={16} className="text-muted-foreground" />
            </button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2 pl-1">
              <div className="size-6 rounded-full bg-surface-2 border border-border shrink-0" />
              <span className="text-[10px] font-bold text-muted-foreground hidden sm:inline uppercase tracking-wider truncate max-w-[80px]">User</span>
            </div>
          </div>
        </header>

        {/* Global Trip Telemetry Bar */}
        <TripStatusBar />

        {/* Content Stage */}
        <div className="relative flex-1 overflow-hidden">
          <motion.div 
            key={pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full w-full"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, label, icon: Icon, active, onClick }: { href: string; label: string; icon: LucideIcon; active: boolean; onClick?: () => void }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={cn(
        "group/item flex h-9 items-center rounded-md px-2 transition-all hover:bg-surface-2",
        active && "bg-surface-2 text-foreground shadow-sm ring-1 ring-border"
      )}
    >
      <div className={cn("grid size-6 shrink-0 place-items-center text-muted-foreground group-hover/item:text-foreground", active && "text-foreground")}>
        <Icon size={16} strokeWidth={active ? 2.5 : 2} />
      </div>
      <span className={cn(
        "ml-3 overflow-hidden truncate text-sm font-medium text-muted-foreground transition-all lg:opacity-0 lg:group-hover:opacity-100 group-hover/item:text-foreground",
        active && "text-foreground lg:opacity-100 font-bold"
      )}>
        {label}
      </span>
    </Link>
  );
}
