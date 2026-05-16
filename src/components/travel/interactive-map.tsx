"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Clock3, 
  Eye, 
  EyeOff, 
  MapPin, 
  Milestone, 
  Minus, 
  Navigation, 
  Plus, 
  RotateCcw, 
  Layers, 
  LucideIcon,
  Star
} from "lucide-react";

import { formatDistance, formatDuration, type MapPin as RoutePin, type MapRoute } from "@/lib/api/mapsService";

type InteractiveMapProps = {
  route: MapRoute;
  mapImageBaseUrl: string | null;
};

type LayerKey = "recommended" | "restaurants" | "hiddenGems" | "route";

const layerLabels: Record<LayerKey, string> = {
  recommended: "Recommended",
  restaurants: "Food",
  hiddenGems: "Hidden Gems",
  route: "Route Line",
};

export function InteractiveMap({ route, mapImageBaseUrl }: InteractiveMapProps) {
  const [selectedPinId, setSelectedPinId] = useState(route.pins[0]?.id ?? "");
  const [zoom, setZoom] = useState(route.zoom);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ recommended: true, restaurants: true, hiddenGems: true, route: true });
  const [sidebarTab, setSidebarTab] = useState<"detail" | "list">("detail");

  const visiblePins = useMemo(() => route.pins.filter((pin) => isPinVisible(pin, layers)), [route.pins, layers]);
  const selectedPin = visiblePins.find((pin) => pin.id === selectedPinId) ?? visiblePins[0] ?? null;
  const visibleRoute = useMemo(() => ({ ...route, zoom }), [route, zoom]);
  const mapImageUrl = mapImageBaseUrl ? `${mapImageBaseUrl}&zoom=${zoom}` : null;
  const positions = useMemo(() => projectPins(visiblePins, visibleRoute), [visiblePins, visibleRoute]);
  const routePositions = useMemo(() => projectPins(route.routePins.filter((pin) => visiblePins.some((visible) => visible.id === pin.id)), visibleRoute), [route, visiblePins, visibleRoute]);
  const isEmpty = route.pins.length === 0;

  return (
    <div className="flex h-full flex-col overflow-hidden lg:flex-row">
      {/* Sidebar - Controls & Detail */}
      <aside className="w-full shrink-0 border-b border-border bg-surface p-6 lg:w-[320px] lg:border-b-0 lg:border-r lg:p-8">
        <div className="flex h-full flex-col gap-8 overflow-y-auto pr-1 scrollbar-hide">
          <section>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">Tactical View</span>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tighter text-foreground">Route Map</h1>
            <div className="mt-6 flex items-center gap-4 border-b border-border/50 pb-6">
               <SummaryItem icon={Milestone} label="Distance" value={formatDistance(route.distanceMeters)} />
               <div className="h-8 w-px bg-border" />
               <SummaryItem icon={Clock3} label="Duration" value={formatDuration(route.duration)} />
            </div>
          </section>

          {/* Layer Controls */}
          <section className="rounded-xl border border-border bg-background p-5 shadow-sm">
            <header className="mb-4">
               <div className="flex items-center gap-2">
                  <Layers size={14} className="text-black" />
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-foreground">Data Layers</h2>
               </div>
            </header>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(layerLabels) as LayerKey[]).map((layer) => (
                <button 
                  key={layer} 
                  type="button" 
                  onClick={() => setLayers((current) => ({ ...current, [layer]: !current[layer] }))} 
                  className={`flex h-9 items-center justify-between rounded-md border px-3 text-left transition-all ${layers[layer] ? "border-black bg-black/5 text-black" : "border-border bg-background text-muted"}`}
                >
                  <span className="text-[9px] font-black uppercase tracking-widest">{layerLabels[layer]}</span>
                  {layers[layer] ? <Eye size={10} /> : <EyeOff size={10} />}
                </button>
              ))}
            </div>
          </section>

          {/* Pin Workspace */}
          <section className="flex-1 flex flex-col min-h-0">
             <div className="flex items-center gap-4 mb-6 border-b border-border">
                <button onClick={() => setSidebarTab("detail")} className={`text-[10px] font-black uppercase tracking-widest pb-2 transition-all ${sidebarTab === "detail" ? "text-foreground border-b-2 border-black" : "text-muted"}`}>Intelligence</button>
                <button onClick={() => setSidebarTab("list")} className={`text-[10px] font-black uppercase tracking-widest pb-2 transition-all ${sidebarTab === "list" ? "text-foreground border-b-2 border-black" : "text-muted"}`}>Index</button>
             </div>

             <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-hide">
                {sidebarTab === "detail" ? (
                  <PinDetail pin={selectedPin} />
                ) : (
                  <div className="space-y-1">
                    {visiblePins.map((pin, index) => (
                      <button key={pin.id} type="button" onClick={() => setSelectedPinId(pin.id)} className={`w-full rounded-md border p-3 text-left transition-all ${selectedPin?.id === pin.id ? "border-black bg-background shadow-sm ring-1 ring-black/5" : "border-border/60 bg-background/50 hover:bg-background"}`}>
                        <div className="flex items-center gap-3">
                           <span className="grid size-5 place-items-center rounded-sm bg-black text-[9px] font-black text-white">{String.fromCharCode(65 + index)}</span>
                           <p className="truncate text-xs font-bold uppercase tracking-tight text-foreground">{pin.label}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
             </div>
          </section>
        </div>
      </aside>

      {/* Main Map Stage */}
      <main className="relative flex-1 overflow-hidden bg-zinc-900">
        <div className="absolute inset-0 z-0">
          {mapImageUrl ? (
            <Image src={mapImageUrl} alt="Route Map" fill loading="eager" className="object-cover opacity-60 grayscale-[0.4]" unoptimized />
          ) : (
            <div className="absolute inset-0 bg-[#071626] opacity-40" style={{ backgroundImage: "linear-gradient(90deg, rgba(125,211,252,.05) 1px, transparent 1px), linear-gradient(rgba(125,211,252,.05) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
          )}
        </div>

        {/* SVG Route Line */}
        {layers.route && routePositions.length > 1 && (
          <svg className="pointer-events-none absolute inset-0 z-10 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline points={routePositions.map((item) => `${item.left},${item.top}`).join(" ")} fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" vectorEffect="non-scaling-stroke" className="opacity-80" />
          </svg>
        )}

        {/* Interactive Pins */}
        {positions.map(({ pin, left, top }, index) => (
          <button
            key={pin.id}
            type="button"
            onClick={() => setSelectedPinId(pin.id)}
            className={`absolute z-20 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[10px] font-black shadow-2xl transition-all hover:scale-125 hover:z-30 border-2 ${selectedPin?.id === pin.id ? "bg-black border-white text-white scale-110" : "bg-white border-border text-foreground"}`}
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            {String.fromCharCode(65 + index)}
          </button>
        ))}

        {/* Zoom Controls */}
        <div className="absolute right-8 bottom-8 z-30 flex flex-col gap-2">
          <button className="size-10 grid place-items-center rounded-md bg-black text-white shadow-xl hover:bg-zinc-800 transition-all" onClick={() => setZoom((current) => Math.min(18, current + 1))}><Plus size={16} /></button>
          <button className="size-10 grid place-items-center rounded-md bg-black text-white shadow-xl hover:bg-zinc-800 transition-all" onClick={() => setZoom((current) => Math.max(3, current - 1))}><Minus size={16} /></button>
          <button className="size-10 grid place-items-center rounded-md bg-background border border-border text-foreground shadow-xl hover:bg-surface transition-all" onClick={() => setZoom(route.zoom)}><RotateCcw size={16} /></button>
        </div>

        {isEmpty && (
           <div className="absolute inset-0 z-40 grid place-items-center bg-black/40 backdrop-blur-sm p-8 text-center">
              <div className="max-w-xs rounded-xl border border-border bg-background p-8 shadow-2xl">
                 <MapPin className="mx-auto size-12 text-black opacity-40 mb-6" />
                 <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Awaiting Points</h2>
                 <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted leading-relaxed">
                    Pin places in discovery or generate an itinerary to unlock the immersive route preview.
                 </p>
                 <Link href="/discover" className="mt-8 block">
                    <button className="h-10 w-full bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-md">Explore Places</button>
                 </Link>
              </div>
           </div>
        )}
      </main>
    </div>
  );
}

function PinDetail({ pin }: { pin: RoutePin | null }) {
  if (!pin) return (
    <div className="py-20 text-center">
       <MapPin className="mx-auto size-8 text-border mb-4" />
       <p className="text-[10px] font-black uppercase tracking-widest text-muted">Select an entity</p>
    </div>
  );
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-3 mb-6">
         <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-muted border border-border">
           {pin.category}
         </span>
         {pin.isHiddenGem && (
           <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase">
             <Star size={10} fill="currentColor" /> Hidden Gem
           </span>
         )}
      </div>
      <h3 className="text-3xl font-black uppercase tracking-tighter text-foreground leading-none">{pin.label}</h3>
      <p className="mt-4 text-xs font-medium leading-relaxed text-muted uppercase tracking-wider">{pin.location}</p>
      
      <div className="mt-10 pt-10 border-t border-border/50">
        <button 
          className="h-12 w-full bg-black text-white shadow-xl hover:bg-zinc-800 font-black text-[10px] uppercase tracking-[0.2em] rounded-md flex items-center justify-center gap-3"
          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pin.label} ${pin.lat},${pin.lng}`)}`, "_blank")}
        >
          <Navigation size={14} /> Open Navigation
        </button>
      </div>
    </div>
  );
}

function SummaryItem({ icon: Icon, label, value }: { icon: LucideIcon, label: string, value: string }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#7d6556]">
        <Icon size={12} /> {label}
      </p>
      <p className="mt-1 text-lg font-medium text-[#31190d] truncate">{value}</p>
    </div>
  );
}

function isPinVisible(pin: RoutePin, layers: Record<LayerKey, boolean>) {
  const isRestaurant = /restaurant|cafe|bar|food|bakery/i.test(pin.category);
  if (pin.isHiddenGem) return layers.hiddenGems;
  if (isRestaurant) return layers.restaurants;
  return layers.recommended;
}

function projectPins(pins: RoutePin[], route: MapRoute) {
  return pins.slice(0, 18).map((pin) => ({ pin, ...projectMercator(pin, route.center, route.zoom) })).filter((item) => item.left >= -5 && item.left <= 105 && item.top >= -5 && item.top <= 105);
}

function projectMercator(pin: RoutePin, center: { lat: number; lng: number }, zoom: number) {
  const scale = 256 * 2 ** zoom;
  const mapWidth = 920;
  const mapHeight = 540;
  const pinPoint = latLngToWorld(pin.lat, pin.lng);
  const centerPoint = latLngToWorld(center.lat, center.lng);
  return {
    left: 50 + ((pinPoint.x - centerPoint.x) * scale / mapWidth) * 100,
    top: 50 + ((pinPoint.y - centerPoint.y) * scale / mapHeight) * 100,
  };
}

function latLngToWorld(lat: number, lng: number) {
  const sin = Math.sin((lat * Math.PI) / 180);
  return { x: (lng + 180) / 360, y: 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI) };
}
