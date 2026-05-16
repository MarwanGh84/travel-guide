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
  PlusCircle,
  TrendingUp,
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
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans selection:bg-black selection:text-white paper-texture">
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
        "group fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-border bg-surface transition-all duration-300 lg:static lg:w-[64px] lg:translate-x-0 lg:hover:w-[240px]",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-12 shrink-0 items-center justify-between px-4">
          <div className="flex items-center">
            <div className="grid size-8 shrink-0 place-items-center rounded bg-black text-white">
              <MapPinned size={18} />
            </div>
            <span className="ml-3 overflow-hidden truncate font-bold tracking-tight lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
              TRAVEL GUIDE
            </span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden">
            <X size={20} className="text-muted" />
          </button>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-2 overflow-y-auto scrollbar-hide">
          {primaryNav.map((item) => (
            <NavItem key={item.href} {...item} active={pathname === item.href} onClick={() => setMobileMenuOpen(false)} />
          ))}
          
          <div className="my-4 h-px bg-border mx-2" />
          
          {secondaryNav.map((item) => (
            <NavItem key={item.href} {...item} active={pathname === item.href} onClick={() => setMobileMenuOpen(false)} />
          ))}
        </nav>

        <div className="mb-4 space-y-1 px-2 shrink-0">
          <NavItem href="/profile" label="Profile" icon={User} active={pathname === "/profile"} onClick={() => setMobileMenuOpen(false)} />
          <NavItem href="/integrations" label="Settings" icon={Settings2} active={pathname === "/integrations"} onClick={() => setMobileMenuOpen(false)} />
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex flex-1 flex-col overflow-hidden relative">
        {/* Command Bar / Global Header */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4 z-30">
          <div className="flex items-center gap-3 text-muted">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="grid size-8 place-items-center rounded hover:bg-surface-2 transition-colors lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="hidden items-center gap-2 lg:flex">
              <span className="text-xs font-medium uppercase tracking-widest opacity-50">Workspace</span>
              <span className="text-border">/</span>
            </div>
            <span className="text-xs font-bold text-foreground truncate max-w-[200px] lg:max-w-none">
              {pathname === "/" ? "Dashboard" : pathname.split("/").filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" / ")}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="grid size-8 place-items-center rounded hover:bg-surface-2 transition-colors">
              <Bell size={16} className="text-muted" />
            </button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2 pl-1">
              <div className="size-6 rounded-full bg-surface-2 border border-border" />
              <span className="text-xs font-medium text-muted hidden sm:inline">User</span>
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
      <div className={cn("grid size-6 shrink-0 place-items-center text-muted group-hover/item:text-foreground", active && "text-foreground")}>
        <Icon size={16} strokeWidth={active ? 2.5 : 2} />
      </div>
      <span className={cn(
        "ml-3 overflow-hidden truncate text-sm font-medium text-muted transition-all lg:opacity-0 lg:group-hover:opacity-100 group-hover/item:text-foreground",
        active && "text-foreground lg:opacity-100"
      )}>
        {label}
      </span>
    </Link>
  );
}
