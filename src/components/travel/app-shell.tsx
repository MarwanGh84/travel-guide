"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
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
  Bed,
  Printer,
  CloudSun,
  Moon,
  Sun
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
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
  { href: "/weather", label: "Weather", icon: CloudSun },
  { href: "/imports", label: "Imports", icon: Bell },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/memories", label: "Memories", icon: Bookmark },
  { href: "/trip-pack", label: "Trip Pack", icon: Printer },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="root-app-shell flex h-screen w-screen overflow-hidden font-sans selection:bg-foreground selection:text-background relative bg-background mesh-gradient-bg transition-colors duration-500">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
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
            <div className="grid size-8 shrink-0 place-items-center rounded bg-foreground text-background shadow-sm transition-colors">
              <MapPinned size={18} />
            </div>
            <span className="ml-3 overflow-hidden truncate text-[11px] font-black tracking-[0.1em] lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100 uppercase text-foreground">
              Travel Workstation
            </span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-2 py-6 scrollbar-hide">
          <div className="space-y-1">
            {primaryNav.map((item) => (
              <NavItem key={item.href} {...item} active={pathname === item.href} onClick={() => setMobileMenuOpen(false)} />
            ))}
          </div>

          <div className="my-6 h-px w-full bg-border/40 lg:my-4" />

          <div className="space-y-1">
            {secondaryNav.map((item) => (
              <NavItem key={item.href} {...item} active={pathname === item.href} onClick={() => setMobileMenuOpen(false)} />
            ))}
          </div>
        </div>

        <div className="border-t border-border/40 p-2 space-y-1">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="group/item flex h-10 w-full items-center rounded-lg transition-all duration-300 ease-out active:scale-[0.95] hover:scale-[1.02] text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            >
              <div className="flex size-10 shrink-0 items-center justify-center">
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </div>
              <span className="ml-1 flex-1 overflow-hidden truncate text-[11px] font-black uppercase tracking-widest transition-all lg:opacity-0 lg:group-hover:opacity-100">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            </button>
          )}
          <NavItem href="/profile" label="Profile" icon={User} active={pathname === "/profile"} onClick={() => setMobileMenuOpen(false)} />
          <NavItem href="/integrations" label="Integrations" icon={Settings2} active={pathname === "/integrations"} onClick={() => setMobileMenuOpen(false)} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex min-w-0 flex-1 flex-col transition-all duration-300 lg:ml-[64px]">
        {/* Mobile Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface/50 px-4 backdrop-blur-sm lg:hidden">
           <button onClick={() => setMobileMenuOpen(true)} className="text-foreground">
              <Menu size={20} />
           </button>
           <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Guide System</span>
           <div className="size-8 rounded-full bg-surface-2" />
        </header>

        <div className="flex-1 overflow-hidden relative">
          <TripStatusBar />
          <div className="h-[calc(100%-40px)] w-full overflow-hidden">
            {children}
          </div>
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
        "group/item flex h-10 items-center rounded-lg transition-all duration-300 ease-out active:scale-[0.95] hover:scale-[1.02]",
        active ? "bg-foreground text-background shadow-xl translate-x-1" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center">
        <Icon size={18} className={cn("transition-transform duration-300", active ? "scale-110" : "group-hover/item:scale-110")} />
      </div>
      <span className={cn(
        "ml-1 flex-1 overflow-hidden truncate text-[11px] font-black uppercase tracking-widest transition-all lg:opacity-0 lg:group-hover:opacity-100",
        active ? "text-background lg:opacity-100" : "text-muted-foreground group-hover/item:text-foreground"
      )}>
        {label}
      </span>
    </Link>
  );
}
