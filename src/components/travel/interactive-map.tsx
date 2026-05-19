"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
  type WheelEvent as ReactWheelEvent,
} from "react";
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
  Star,
  ChevronRight,
  Info
} from "lucide-react";

import { buildGoogleMapsDirectionsUrl, formatDistance, formatDuration, type MapPin as RoutePin, type MapRoute } from "@/lib/api/mapsService";
import { cn } from "@/lib/utils";

type InteractiveMapProps = {
  route: MapRoute;
  mapImageBaseUrl: string | null;
  browserMapApiKey: string | null;
};

type LayerKey = "recommended" | "restaurants" | "hiddenGems" | "route";
type MapStyleKey = "roadmap" | "editorial" | "night";

const layerLabels: Record<LayerKey, string> = {
  recommended: "Recommended",
  restaurants: "Food",
  hiddenGems: "Hidden Gems",
  route: "Route Line",
};

export function InteractiveMap({ route, mapImageBaseUrl, browserMapApiKey }: InteractiveMapProps) {
  const [selectedPinId, setSelectedPinId] = useState(route.pins[0]?.id ?? "");
  const [zoom, setZoom] = useState(route.zoom);
  const [center, setCenter] = useState(route.center);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ recommended: true, restaurants: true, hiddenGems: true, route: true });
  const [sidebarTab, setSidebarTab] = useState<"detail" | "list" | "segments">("list");
  const dragState = useRef<{ pointerId: number; x: number; y: number; center: { lat: number; lng: number } } | null>(null);

  const visiblePins = useMemo(() => route.pins.filter((pin) => isPinVisible(pin, layers)), [route.pins, layers]);
  const selectedPin = visiblePins.find((pin) => pin.id === selectedPinId) ?? visiblePins[0] ?? null;
  const visibleRoute = useMemo(() => ({ ...route, center, zoom }), [center, route, zoom]);
  const mapImageUrl = mapImageBaseUrl && center ? `${mapImageBaseUrl}&zoom=${zoom}&lat=${center.lat}&lng=${center.lng}` : null;
  const positions = useMemo(() => projectPins(visiblePins, visibleRoute), [visiblePins, visibleRoute]);
  const routePositions = useMemo(() => projectPins(route.routePins.filter((pin) => visiblePins.some((visible) => visible.id === pin.id)), visibleRoute), [route, visiblePins, visibleRoute]);
  const isEmpty = route.pins.length === 0;
  const googleMapsRouteUrl = buildGoogleMapsDirectionsUrl(route.routePins);

  function handleWheel(event: ReactWheelEvent<HTMLElement>) {
    event.preventDefault();
    setZoom((current) => Math.min(18, Math.max(3, current + (event.deltaY < 0 ? 1 : -1))));
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (!center) return;
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button, a")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, center };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    setCenter(centerAfterDrag(drag.center, zoom, dx, dy));
  }

  function stopDragging(event: ReactPointerEvent<HTMLElement>) {
    if (dragState.current?.pointerId !== event.pointerId) return;
    dragState.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
      {/* Sidebar - Controls & Detail */}
      <aside className="w-full shrink-0 border-b border-border bg-surface lg:h-full lg:w-[350px] lg:border-b-0 lg:border-r shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
        <div className="flex flex-col lg:h-full">
          <section className="p-6 lg:p-8 border-b border-border bg-background">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Tactical View</span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tighter text-foreground">Mission Map</h1>
            <div className="mt-6 flex items-center gap-4">
               <SummaryItem icon={Milestone} label={route.metricSource === "google-routes" ? "Google route" : "Distance"} value={formatDistance(route.distanceMeters)} />
               <div className="h-8 w-px bg-border" />
               <SummaryItem icon={Clock3} label={route.metricSource === "google-routes" ? "Google time" : "Duration"} value={formatDuration(route.duration)} />
            </div>
          </section>

          {/* Sidebar Nav */}
          <nav className="flex items-center px-4 sm:px-6 lg:px-8 border-b border-border bg-surface shrink-0">
             <SidebarTab active={sidebarTab === "list"} label="Index" onClick={() => setSidebarTab("list")} />
             <SidebarTab active={sidebarTab === "segments"} label="Segments" onClick={() => setSidebarTab("segments")} />
             <SidebarTab active={sidebarTab === "detail"} label="Intel" onClick={() => setSidebarTab("detail")} />
          </nav>

          {/* Scrollable Content Area */}
          <div className="min-h-0 flex-1 space-y-8 overflow-y-auto p-6 pb-20 scrollbar-hide lg:p-8 lg:pb-8">
             {sidebarTab === "list" && (
               <section className="space-y-1">
                  {visiblePins.map((pin, index) => (
                    <button 
                      key={pin.id} 
                      onClick={() => { setSelectedPinId(pin.id); setSidebarTab("detail"); }}
                      className={cn(
                        "w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all group",
                        selectedPinId === pin.id ? "bg-background border-black shadow-md ring-1 ring-black/5" : "bg-background/50 border-border/60 hover:border-black"
                      )}
                    >
                       <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-black text-[10px] font-black text-white shadow-sm">{String.fromCharCode(65 + index)}</span>
                       <div className="min-w-0 flex-1">
                          <h4 className="truncate text-[11px] font-black uppercase tracking-tight text-foreground">{pin.label}</h4>
                          <p className="truncate text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70 mt-0.5">{pin.category}</p>
                       </div>
                       <ChevronRight size={12} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
               </section>
             )}

             {sidebarTab === "segments" && (
               <section className="space-y-6">
                  {route.segments.length > 0 ? (
                    route.segments.map((segment, index) => (
                      <div key={index} className="relative pl-8 before:absolute before:left-[11px] before:top-6 before:h-[calc(100%-16px)] before:w-0.5 before:border-l-2 before:border-dashed before:border-border last:before:hidden py-1">
                         <div className="absolute left-1 top-2 grid size-4 place-items-center rounded-full bg-black ring-4 ring-surface shadow-sm" />
                         
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Segment 0{index + 1}</span>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700 ring-1 ring-emerald-200 uppercase">{formatDistance(segment.distanceMeters)}</span>
                         </div>
                         
                         <h4 className="text-[11px] font-black uppercase tracking-tight text-foreground">{segment.origin}</h4>
                         
                         <div className="my-4 flex items-center gap-3 py-1 px-3 rounded-md bg-surface-2/50 border border-border/40 w-fit shadow-inner">
                            <Navigation size={10} className="text-muted-foreground rotate-90" />
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Transit</span>
                              <span className="text-[9px] font-bold uppercase text-foreground leading-none">{segment.metricSource === "straight-line-estimate" ? "Estimated duration" : formatDuration(segment.duration)}</span>
                              <span className="mt-1 text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">{segmentMetricLabel(segment.metricSource)}</span>
                            </div>
                         </div>
                         
                         <h4 className="text-[11px] font-black uppercase tracking-tight text-foreground">{segment.destination}</h4>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center opacity-40">
                       <Info size={32} className="mx-auto mb-4" strokeWidth={1} />
                       <p className="text-[10px] font-bold uppercase tracking-widest">Add at least two mapped points to compute segments</p>
                    </div>
                  )}
               </section>
             )}

             {sidebarTab === "detail" && (
                <PinDetail pin={selectedPin} />
             )}

             {route.missingPlaces.length > 0 && (
               <section className="rounded-2xl border border-rose-200 bg-rose-50/30 p-6 shadow-inner">
                  <header className="mb-4 flex items-center gap-2 text-rose-700">
                     <Info size={14} />
                     <h2 className="text-[10px] font-black uppercase tracking-widest">Incomplete Mapping</h2>
                  </header>
                  <div className="space-y-3">
                    {route.missingPlaces.map((place) => (
                      <div key={place.id} className="rounded-lg border border-rose-100 bg-background/80 p-3 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-tight text-foreground">{place.label}</p>
                        <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-rose-600/70">{place.reason}</p>
                      </div>
                    ))}
                  </div>
               </section>
             )}

             {googleMapsRouteUrl && (
               <section className="rounded-2xl border border-border bg-surface p-6 shadow-inner">
                  <header className="mb-4 flex items-center gap-2">
                     <Navigation size={14} className="text-black" />
                     <h2 className="text-[10px] font-black uppercase tracking-widest text-foreground">Route Actions</h2>
                  </header>
                  <Link
                    href={googleMapsRouteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-black text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-zinc-800 shadow-xl"
                  >
                    <Navigation size={14} /> Open in Google Maps
                  </Link>
               </section>
             )}

             {/* Layer Controls - Always visible at bottom of scroll if list is long */}
             <section className="rounded-2xl border border-border bg-surface p-6 shadow-inner mt-8">
                <header className="mb-4 flex items-center gap-2">
                   <Layers size={14} className="text-black" />
                   <h2 className="text-[10px] font-black uppercase tracking-widest text-foreground">Data Layers</h2>
                </header>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(layerLabels) as LayerKey[]).map((layer) => (
                    <button 
                      key={layer} 
                      type="button" 
                      onClick={() => setLayers((current) => ({ ...current, [layer]: !current[layer] }))} 
                      className={cn(
                        "flex h-9 items-center justify-between rounded-lg border px-3 text-left transition-all",
                        layers[layer] ? "border-black bg-black text-white shadow-lg" : "border-border bg-background text-muted hover:border-black"
                      )}
                    >
                      <span className="text-[9px] font-black uppercase tracking-widest">{layerLabels[layer]}</span>
                      {layers[layer] ? <Eye size={10} /> : <EyeOff size={10} />}
                    </button>
                  ))}
                </div>
             </section>
          </div>
        </div>
      </aside>

      {/* Main Map Stage */}
      <main className="relative min-h-[420px] flex-1 overflow-hidden bg-zinc-900 lg:min-h-0">
        {browserMapApiKey && route.center ? (
          <GoogleBrowserMap
            apiKey={browserMapApiKey}
            route={route}
            visiblePins={visiblePins}
            selectedPinId={selectedPinId}
            layers={layers}
            onSelectPin={(pinId) => {
              setSelectedPinId(pinId);
              setSidebarTab("detail");
            }}
          />
        ) : (
          <StaticMapFallback
            route={route}
            visiblePins={visiblePins}
            visibleRoute={visibleRoute}
            selectedPinId={selectedPinId}
            mapImageUrl={mapImageUrl}
            positions={positions}
            routePositions={routePositions}
            layers={layers}
            zoom={zoom}
            setZoom={setZoom}
            setCenter={setCenter}
            handleWheel={handleWheel}
            handlePointerDown={handlePointerDown}
            handlePointerMove={handlePointerMove}
            stopDragging={stopDragging}
            onSelectPin={(pinId) => {
              setSelectedPinId(pinId);
              setSidebarTab("detail");
            }}
          />
        )}

        {isEmpty && (
           <div className="absolute inset-0 z-40 grid place-items-center bg-black/40 backdrop-blur-sm p-8 text-center">
              <div className="max-w-xs rounded-2xl border border-border bg-background p-8 shadow-2xl">
                 <MapPin className="mx-auto size-12 text-black opacity-40 mb-6" />
                 <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Awaiting Points</h2>
                 <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-relaxed">
                    Pin places in discovery or generate an itinerary to unlock the immersive route preview.
                 </p>
                 <Link href="/discover" className="mt-8 block">
                    <button className="h-11 w-full bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-xl hover:bg-zinc-800 transition-all">Explore Places</button>
                 </Link>
              </div>
           </div>
        )}
      </main>
    </div>
  );
}

type StaticMapFallbackProps = {
  route: MapRoute;
  visiblePins: RoutePin[];
  visibleRoute: MapRoute;
  selectedPinId: string;
  mapImageUrl: string | null;
  positions: Array<{ pin: RoutePin; left: number; top: number }>;
  routePositions: Array<{ pin: RoutePin; left: number; top: number }>;
  layers: Record<LayerKey, boolean>;
  zoom: number;
  setZoom: Dispatch<SetStateAction<number>>;
  setCenter: Dispatch<SetStateAction<{ lat: number; lng: number } | undefined>>;
  handleWheel: (event: ReactWheelEvent<HTMLElement>) => void;
  handlePointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  handlePointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  stopDragging: (event: ReactPointerEvent<HTMLElement>) => void;
  onSelectPin: (pinId: string) => void;
};

function StaticMapFallback({
  route,
  selectedPinId,
  mapImageUrl,
  positions,
  routePositions,
  layers,
  setZoom,
  setCenter,
  handleWheel,
  handlePointerDown,
  handlePointerMove,
  stopDragging,
  onSelectPin,
}: StaticMapFallbackProps) {
  return (
    <div
      className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
    >
      <div className="absolute inset-0 z-0">
        {mapImageUrl ? (
          <Image
            src={mapImageUrl}
            alt="Route Map"
            fill
            loading="eager"
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
            className="select-none object-cover opacity-60 grayscale-[0.4]"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-[#071626] opacity-40" style={{ backgroundImage: "linear-gradient(90deg, rgba(125,211,252,.05) 1px, transparent 1px), linear-gradient(rgba(125,211,252,.05) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
        )}
      </div>

      {layers.route && routePositions.length > 1 && (
        <svg className="pointer-events-none absolute inset-0 z-10 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline points={routePositions.map((item) => `${item.left},${item.top}`).join(" ")} fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" vectorEffect="non-scaling-stroke" className="opacity-80" />
        </svg>
      )}

      {positions.map(({ pin, left, top }, index) => (
        <button
          key={pin.id}
          type="button"
          onClick={() => onSelectPin(pin.id)}
          className={cn(
            "absolute z-20 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 text-[10px] font-black shadow-2xl transition-all hover:z-30 hover:scale-125",
            selectedPinId === pin.id ? "scale-110 border-white bg-black text-white" : "border-border bg-white text-foreground",
          )}
          style={{ left: `${left}%`, top: `${top}%` }}
        >
          {String.fromCharCode(65 + index)}
        </button>
      ))}

      <div className="absolute right-4 bottom-4 z-30 flex flex-col gap-2 sm:right-8 sm:bottom-8">
        <button className="grid size-11 place-items-center rounded-md bg-black text-white shadow-xl transition-all hover:bg-zinc-800 sm:size-10" onClick={() => setZoom((current) => Math.min(18, current + 1))}><Plus size={18} className="sm:size-4" /></button>
        <button className="grid size-11 place-items-center rounded-md bg-black text-white shadow-xl transition-all hover:bg-zinc-800 sm:size-10" onClick={() => setZoom((current) => Math.max(3, current - 1))}><Minus size={18} className="sm:size-4" /></button>
        <button
          className="grid size-11 place-items-center rounded-md border border-border bg-background text-foreground shadow-xl transition-all hover:bg-surface sm:size-10"
          onClick={() => {
            setZoom(route.zoom);
            setCenter(route.center);
          }}
        >
          <RotateCcw size={18} className="sm:size-4" />
        </button>
      </div>
    </div>
  );
}

type GoogleBrowserMapProps = {
  apiKey: string;
  route: MapRoute;
  visiblePins: RoutePin[];
  selectedPinId: string;
  layers: Record<LayerKey, boolean>;
  onSelectPin: (pinId: string) => void;
};

function GoogleBrowserMap({ apiKey, route, visiblePins, selectedPinId, layers, onSelectPin }: GoogleBrowserMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markersRef = useRef<Map<string, GoogleMarkerInstance>>(new Map());
  const polylineRef = useRef<GooglePolylineInstance | null>(null);
  const infoWindowRef = useRef<GoogleInfoWindowInstance | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [mapStyle, setMapStyle] = useState<MapStyleKey>("editorial");

  useEffect(() => {
    const initialCenter = route.center;
    if (!initialCenter) return;
    let cancelled = false;
    const markers = markersRef.current;
    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new window.google.maps.Map(containerRef.current, {
          center: initialCenter,
          zoom: route.zoom,
          gestureHandling: "greedy",
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
          clickableIcons: false,
          styles: googleMapStyles.editorial,
        });
        infoWindowRef.current = new window.google.maps.InfoWindow();
        fitRouteBounds(mapRef.current, route.routePins.length ? route.routePins : visiblePins);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));

    return () => {
      cancelled = true;
      markers.forEach((marker) => marker.setMap(null));
      markers.clear();
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
      mapRef.current = null;
    };
  }, [apiKey, route.center, route.routePins, route.zoom, visiblePins]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();
    visiblePins.forEach((pin, index) => {
      const marker = new window.google.maps.Marker({
        map: mapRef.current!,
        position: { lat: pin.lat, lng: pin.lng },
        title: pin.label,
        label: String.fromCharCode(65 + index),
        zIndex: pin.id === selectedPinId ? 2 : 1,
        icon: markerIcon(pin.id === selectedPinId),
      });
      marker.addListener("click", () => onSelectPin(pin.id));
      markersRef.current.set(pin.id, marker);
    });
  }, [onSelectPin, selectedPinId, status, visiblePins]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;
    const selectedPin = visiblePins.find((pin) => pin.id === selectedPinId);
    const selectedMarker = selectedPin ? markersRef.current.get(selectedPin.id) : undefined;
    if (!selectedPin || !selectedMarker || !infoWindowRef.current) return;

    mapRef.current.panTo({ lat: selectedPin.lat, lng: selectedPin.lng });
    infoWindowRef.current.setContent(infoWindowMarkup(selectedPin));
    infoWindowRef.current.open({ map: mapRef.current, anchor: selectedMarker });
  }, [selectedPinId, status, visiblePins]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;
    polylineRef.current?.setMap(null);
    polylineRef.current = null;
    if (!layers.route || route.routePins.length < 2) return;

    polylineRef.current = new window.google.maps.Polyline({
      map: mapRef.current,
      path: route.routePins.map((pin) => ({ lat: pin.lat, lng: pin.lng })),
      geodesic: true,
      strokeColor: "#111111",
      strokeOpacity: 0.9,
      strokeWeight: 3,
    });
  }, [layers.route, route.routePins, status]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;
    mapRef.current.setOptions({ styles: googleMapStyles[mapStyle] });
  }, [mapStyle, status]);

  function recenterRoute() {
    if (!mapRef.current) return;
    fitRouteBounds(mapRef.current, route.routePins.length ? route.routePins : visiblePins);
  }

  if (status === "error") {
    return (
      <div className="absolute inset-0 grid place-items-center bg-background text-center">
        <div>
          <p className="text-sm font-semibold text-foreground">Interactive map unavailable</p>
          <p className="mt-2 text-xs text-muted">Check the browser map key and Maps JavaScript API access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="absolute inset-0" />
      {status === "loading" && <div className="absolute inset-0 animate-pulse bg-zinc-200" />}
      {status === "ready" && (
        <>
          <div className="absolute left-4 top-4 z-10 flex rounded-xl border border-white/70 bg-white/90 p-1 shadow-xl backdrop-blur sm:left-6 sm:top-6">
            {(Object.keys(mapStyleLabels) as MapStyleKey[]).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setMapStyle(style)}
                className={cn(
                  "h-9 rounded-lg px-3 text-[9px] font-black uppercase tracking-widest transition-colors",
                  mapStyle === style ? "bg-black text-white" : "text-zinc-600 hover:text-black",
                )}
              >
                {mapStyleLabels[style]}
              </button>
            ))}
          </div>
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 sm:bottom-6 sm:right-6">
          <button
            type="button"
            onClick={() => mapRef.current?.setZoom(Math.min(20, (mapRef.current?.getZoom() ?? route.zoom) + 1))}
            className="grid size-11 place-items-center rounded-lg bg-black text-white shadow-xl transition-all hover:bg-zinc-800"
            aria-label="Zoom in"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.setZoom(Math.max(3, (mapRef.current?.getZoom() ?? route.zoom) - 1))}
            className="grid size-11 place-items-center rounded-lg bg-black text-white shadow-xl transition-all hover:bg-zinc-800"
            aria-label="Zoom out"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            onClick={recenterRoute}
            className="grid size-11 place-items-center rounded-lg border border-border bg-background text-foreground shadow-xl transition-all hover:bg-surface"
            aria-label="Recenter route"
          >
            <RotateCcw size={16} />
          </button>
          </div>
        </>
      )}
    </div>
  );
}

let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string) {
  if (typeof window !== "undefined" && window.google?.maps) return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps failed to load."));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

type GoogleMapInstance = {
  setCenter(position: { lat: number; lng: number }): void;
  panTo(position: { lat: number; lng: number }): void;
  fitBounds(bounds: GoogleLatLngBoundsInstance, padding?: number): void;
  setZoom(zoom: number): void;
  getZoom(): number | undefined;
  setOptions(options: { styles: GoogleMapStyleRule[] | null }): void;
};

type GoogleMarkerInstance = {
  setMap(map: GoogleMapInstance | null): void;
  addListener(eventName: "click", handler: () => void): void;
};

type GooglePolylineInstance = {
  setMap(map: GoogleMapInstance | null): void;
};

type GoogleInfoWindowInstance = {
  setContent(content: string): void;
  open(options: { map: GoogleMapInstance; anchor: GoogleMarkerInstance }): void;
  close(): void;
};

type GoogleLatLngBoundsInstance = {
  extend(position: { lat: number; lng: number }): void;
};

declare global {
  interface Window {
    google: {
      maps: {
        Map: new (
          container: HTMLElement,
          options: {
            center: { lat: number; lng: number };
            zoom: number;
            gestureHandling: "greedy";
            streetViewControl: boolean;
            fullscreenControl: boolean;
            mapTypeControl: boolean;
            clickableIcons: boolean;
            styles: GoogleMapStyleRule[] | null;
          },
        ) => GoogleMapInstance;
        Marker: new (options: {
          map: GoogleMapInstance;
          position: { lat: number; lng: number };
          title: string;
          label: string;
          zIndex: number;
          icon: {
            path: string;
            fillColor: string;
            fillOpacity: number;
            strokeColor: string;
            strokeWeight: number;
            scale: number;
            labelOrigin: { x: number; y: number };
          };
        }) => GoogleMarkerInstance;
        Polyline: new (options: {
          map: GoogleMapInstance;
          path: Array<{ lat: number; lng: number }>;
          geodesic: boolean;
          strokeColor: string;
          strokeOpacity: number;
          strokeWeight: number;
        }) => GooglePolylineInstance;
        InfoWindow: new () => GoogleInfoWindowInstance;
        LatLngBounds: new () => GoogleLatLngBoundsInstance;
      };
    };
  }
}

type GoogleMapStyleRule = {
  featureType?: string;
  elementType?: string;
  stylers: Array<Record<string, string | number>>;
};

const mapStyleLabels: Record<MapStyleKey, string> = {
  roadmap: "Classic",
  editorial: "Editorial",
  night: "Night",
};

const googleMapStyles: Record<MapStyleKey, GoogleMapStyleRule[] | null> = {
  roadmap: null,
  editorial: [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#d8d4ce" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6b6258" }] },
    { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f4efe7" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#b8d8e8" }] },
  ],
  night: [
    { elementType: "geometry", stylers: [{ color: "#18181b" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#d4d4d8" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#18181b" }] },
    { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#52525b" }] },
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#27272a" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#a1a1aa" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#082f49" }] },
  ],
};

function fitRouteBounds(map: GoogleMapInstance, pins: RoutePin[]) {
  if (!pins.length) return;
  if (pins.length === 1) {
    map.setCenter({ lat: pins[0].lat, lng: pins[0].lng });
    map.setZoom(15);
    return;
  }
  const bounds = new window.google.maps.LatLngBounds();
  pins.forEach((pin) => bounds.extend({ lat: pin.lat, lng: pin.lng }));
  map.fitBounds(bounds, 72);
}

function markerIcon(selected: boolean) {
  return {
    path: "M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8Z",
    fillColor: selected ? "#111111" : "#ffffff",
    fillOpacity: 1,
    strokeColor: selected ? "#ffffff" : "#111111",
    strokeWeight: selected ? 2.5 : 2,
    scale: selected ? 1.45 : 1.25,
    labelOrigin: { x: 12, y: 10 },
  };
}

function infoWindowMarkup(pin: RoutePin) {
  return `
    <div style="min-width:180px;padding:4px 2px 2px;color:#111111;font-family:inherit;">
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;">${escapeHtml(pin.label)}</div>
      <div style="margin-top:4px;font-size:10px;color:#52525b;text-transform:uppercase;letter-spacing:.08em;">${escapeHtml(pin.category)}</div>
      <div style="margin-top:6px;font-size:10px;color:#71717a;">${escapeHtml(pin.location || "Mapped location")}</div>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function PinDetail({ pin }: { pin: RoutePin | null }) {
  if (!pin) return (
    <div className="py-20 text-center opacity-40">
       <MapPin className="mx-auto size-8 text-border mb-4" />
       <p className="text-[10px] font-black uppercase tracking-widest text-muted">Select an entity from index</p>
    </div>
  );
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-3 mb-6">
         <span className="rounded-full bg-surface-2 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-muted-foreground/70 border border-border">
           {pin.category}
         </span>
         {pin.isHiddenGem && (
           <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase">
             <Star size={10} fill="currentColor" /> Hidden Gem
           </span>
         )}
      </div>
      <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-foreground leading-tight sm:leading-none">{pin.label}</h3>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-relaxed">{pin.location}</p>
      
      <div className="mt-8 space-y-2 border-t border-border pt-8">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Telemetric Source</p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[8px] font-bold uppercase text-muted-foreground border border-border">
            {pin.coordinateSource === "google-places-geocoding" ? "Geocoded Estimate" : "Provider Mapped"}
          </span>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[8px] font-bold uppercase text-muted-foreground border border-border">
            {formatMatchMethod(pin.matchMethod)}
          </span>
        </div>
      </div>
      
      <div className="mt-10 pt-10 border-t border-border/50">
        <button 
          className="h-12 w-full bg-black text-white shadow-xl hover:bg-zinc-800 font-black text-[10px] uppercase tracking-[0.2em] rounded-lg flex items-center justify-center gap-3 transition-all"
          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pin.label} ${pin.lat},${pin.lng}`)}`, "_blank")}
        >
          <Navigation size={14} /> Open Navigation
        </button>
      </div>
    </div>
  );
}

function SidebarTab({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 text-[10px] font-black uppercase tracking-widest py-4 border-b-2 transition-all",
        active ? "text-foreground border-black" : "text-muted-foreground/40 border-transparent hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

function SummaryItem({ icon: Icon, label, value }: { icon: LucideIcon, label: string, value: string }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
        <Icon size={12} className="text-black" /> {label}
      </p>
      <p className="mt-1 text-xl font-bold text-foreground truncate uppercase tracking-tight leading-none">{value}</p>
    </div>
  );
}

function formatMatchMethod(method?: string) {
  switch (method) {
    case "matched-by-name": return "Name match";
    case "linked-record": return "Linked record";
    case "saved-place": return "Saved order";
    case "unlinked-itinerary-item": return "Text only";
    default: return "Discovery";
  }
}

function segmentMetricLabel(source: MapRoute["segments"][number]["metricSource"]) {
  if (source === "straight-line-estimate") return "Straight-line estimate";
  return "Unavailable";
}

function isPinVisible(pin: RoutePin, layers: Record<LayerKey, boolean>) {
  const isRestaurant = /restaurant|cafe|bar|food|bakery/i.test(pin.category);
  if (pin.isHiddenGem) return layers.hiddenGems;
  if (isRestaurant) return layers.restaurants;
  return layers.recommended;
}

function projectPins(pins: RoutePin[], route: MapRoute) {
  const center = route.center;
  if (!center) return [];
  return pins.slice(0, 18).map((pin) => ({ pin, ...projectMercator(pin, center, route.zoom) })).filter((item) => item.left >= -5 && item.left <= 105 && item.top >= -5 && item.top <= 105);
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

function worldToLatLng(x: number, y: number) {
  const lng = x * 360 - 180;
  const latRadians = Math.atan(Math.sinh(Math.PI * (1 - 2 * y)));
  return { lat: (latRadians * 180) / Math.PI, lng };
}

function centerAfterDrag(center: { lat: number; lng: number }, zoom: number, dx: number, dy: number) {
  const scale = 256 * 2 ** zoom;
  const centerPoint = latLngToWorld(center.lat, center.lng);
  return worldToLatLng(
    centerPoint.x - dx / scale,
    Math.min(0.999999, Math.max(0.000001, centerPoint.y - dy / scale)),
  );
}
