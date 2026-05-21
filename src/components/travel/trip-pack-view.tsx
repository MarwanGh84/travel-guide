"use client";

import { Printer, MapPin, Calendar, Users, Info, Ticket, Plane, Hotel, Car, FileText, Phone, HardDrive, Coins, CloudSun, ExternalLink, AlertTriangle, Edit3, Utensils, ShieldAlert } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { PrimaryTrip } from "@/lib/db/travel";
import type { WeatherSummary } from "@/lib/api/weatherService";
import type { ExchangeRate } from "@/lib/api/currencyService";
import type { DriveMemorySource } from "@prisma/client";

type TripPackViewProps = {
  trip: PrimaryTrip | null; 
  weather: WeatherSummary | null;
  exchangeRate: ExchangeRate | { base: string; quote: string; rate: number; source: { note: string } } | null;
  driveSources: DriveMemorySource[];
};

export function TripPackView({ trip, weather, exchangeRate, driveSources }: TripPackViewProps) {
  if (!trip) return <div className="p-12 text-center text-muted">Trip data not found.</div>;

  const handlePrint = () => {
    window.print();
  };

  const today = new Date();
  const tripDuration = Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Map link for all saved places
  const allPlaces = trip.itineraryDays.flatMap((day) => 
    day.items.map((item) => item.placeRecommendation).filter((p): p is NonNullable<typeof p> => Boolean(p))
  );
  const uniquePlaces = Array.from(new Map(allPlaces.map((p) => [p.id, p])).values());
  const googleMapsUrl = uniquePlaces.length > 0 
    ? `https://www.google.com/maps/dir/${uniquePlaces.map((p) => p.latitude && p.longitude ? `${p.latitude},${p.longitude}` : encodeURIComponent(p.name)).join("/")}`
    : null;

  return (
    <div className="h-full overflow-y-auto bg-background text-foreground print:h-auto print:overflow-visible print:bg-white print:text-black scrollbar-hide">
      {/* Styles to override global overflow: hidden and background for printing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Force all layout parents to be visible and unconstrained */
          html, body, .root-app-shell, .root-app-shell > main, .root-app-shell > main > div {
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
            display: block !important;
            position: relative !important;
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }

          /* Specifically target the inner content wrapper to allow it to expand */
          .root-app-shell > main > div > div {
             overflow: visible !important;
             height: auto !important;
          }

          /* Hide UI elements */
          .root-app-shell > aside, 
          .root-app-shell > main > header,
          .trip-status-bar,
          header.no-print, 
          .no-print {
            display: none !important;
          }

          /* Reset specifically for the content area */
          .max-w-4xl {
            max-width: 100% !important;
            padding: 1.5cm !important;
            margin: 0 auto !important;
          }

          .page-break {
            page-break-before: always !important;
            break-before: page !important;
            margin-top: 1cm !important;
          }

          img, tr, section, .rounded-xl, .grid {
            break-inside: avoid !important;
          }

          /* Ensure high contrast for print */
          * {
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide scrollbars in print */
          ::-webkit-scrollbar {
            display: none !important;
          }
        }
      `}} />

      {/* Header / Nav */}
      <header className="no-print sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg bg-foreground text-background">
            <Info size={18} />
          </div>
          <h1 className="text-sm font-black uppercase tracking-widest text-foreground">Trip Pack: {trip.name}</h1>
        </div>
        <button
          onClick={handlePrint}
          className="flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-[10px] font-black uppercase tracking-widest text-background hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-lg"
        >
          <Printer size={14} /> Print Pack
        </button>
      </header>

      <main className="mx-auto max-w-4xl p-8 sm:p-12 lg:p-16">
        {/* 1. Summary Section */}
        <section className="mb-12 border-b border-border pb-12">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Offline Journey Guide</span>
              <h2 className="mt-2 text-4xl font-black uppercase tracking-tighter sm:text-6xl">{trip.destination || "Personal Journey"}</h2>
              <p className="mt-2 text-lg font-bold text-muted uppercase tracking-widest">{trip.destinationCountry || "Global"}</p>
            </div>
            <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-muted">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-foreground" />
                <span>{new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={14} className="text-foreground" />
                <span>{trip.travelerCount} Travelers</span>
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
            <SummaryItem label="Duration" value={`${tripDuration} Days`} />
            <SummaryItem label="Budget" value={formatCurrency(trip.budget, trip.currency)} />
            <SummaryItem label="Style" value={trip.travelStyle} />
            <SummaryItem label="Pace" value={trip.pace} />
          </div>
        </section>

        {/* 2. Itinerary Section */}
        <section className="mb-12 page-break">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
              <Calendar size={20} /> Daily Itinerary
            </h3>
          </div>
          <div className="space-y-12">
            {trip.itineraryDays.length > 0 ? trip.itineraryDays.map((day, idx) => (
              <div key={day.id} className="grid gap-6 border-l-2 border-border pl-8 relative">
                <div className="absolute -left-[9px] top-0 size-4 rounded-full border-4 border-background bg-foreground" />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                  <h4 className="text-lg font-black uppercase tracking-tight">Day {idx + 1}: {day.theme}</h4>
                  <span className="text-[10px] font-bold text-muted uppercase">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </div>
                
                <div className="grid gap-6 sm:grid-cols-3">
                  <PlanBox label="Morning" content={day.morningPlan} />
                  <PlanBox label="Afternoon" content={day.afternoonPlan} />
                  <PlanBox label="Evening" content={day.eveningPlan} />
                </div>

                {day.items.length > 0 && (
                  <div className="mt-2 space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted">Scheduled Points</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {day.items.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 rounded-lg border border-border bg-surface-2 p-3">
                          <div className="grid size-6 shrink-0 place-items-center rounded bg-background border border-border">
                            {item.placeRecommendation ? <MapPin size={12} className="text-foreground" /> : <Edit3 size={12} className="text-muted" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{item.title}</p>
                            {item.placeRecommendation && (
                              <p className="mt-1 text-[9px] text-muted truncate">{item.placeRecommendation.location}</p>
                            )}
                            {!item.placeRecommendation && (
                              <p className="mt-1 text-[8px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                                <AlertTriangle size={8} /> AI Drafted Point
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {day.notes && (
                  <div className="rounded-lg bg-surface-2 p-4 italic text-muted-2 text-sm leading-relaxed">
                    {day.notes}
                  </div>
                )}
              </div>
            )) : (
              <p className="text-sm italic text-muted">No itinerary days added to this trip yet.</p>
            )}
          </div>
        </section>

        {/* 3. Bookings Section */}
        <section className="mb-12 page-break">
          <h3 className="mb-8 text-xl font-black uppercase tracking-widest flex items-center gap-3">
            <Ticket size={20} /> Reservations & Bookings
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {trip.bookings.length > 0 ? trip.bookings.map((booking) => (
              <div key={booking.id} className="rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-8 place-items-center rounded-lg bg-surface-2 border border-border">
                      {getBookingIcon(booking.type)}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-tight">{booking.title}</p>
                      <p className="text-[9px] font-bold text-muted uppercase tracking-widest">{booking.type}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-widest">
                  <div>
                    <p className="text-muted mb-1">Provider</p>
                    <p>{booking.provider || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted mb-1">Confirmation</p>
                    <p className="font-mono">{booking.confirmationNumber || "NO_REF"}</p>
                  </div>
                  <div>
                    <p className="text-muted mb-1">Schedule</p>
                    <p>{booking.startAt ? new Date(booking.startAt).toLocaleDateString() : "PENDING"}</p>
                  </div>
                  {booking.notes && (
                    <div className="col-span-2">
                      <p className="text-muted mb-1">Notes</p>
                      <p className="normal-case tracking-normal">{booking.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div className="col-span-2 py-8 text-center border-2 border-dashed border-border rounded-xl opacity-40">
                <p className="text-[10px] font-black uppercase tracking-widest">No bookings recorded</p>
              </div>
            )}
          </div>
        </section>

        {/* 4. Documents & Readiness */}
        <section className="mb-12 page-break">
          <h3 className="mb-8 text-xl font-black uppercase tracking-widest flex items-center gap-3">
            <FileText size={20} /> Readiness & Documents
          </h3>
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Intelligence Check</p>
              <div className="rounded-xl border border-border p-5 space-y-3">
                {trip.bookingChecklist.length > 0 ? trip.bookingChecklist.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded",
                      item.status === "done" ? "bg-emerald-50 text-emerald-600" : 
                      item.status === "not_needed" ? "bg-surface-2 text-muted/50" : "bg-rose-50 text-rose-600"
                    )}>
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                )) : <p className="text-xs text-muted">No checklist found.</p>}
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Stored Documents</p>
              <div className="space-y-3">
                {trip.documentNotes.length > 0 ? trip.documentNotes.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText size={14} className="text-muted shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase truncate">{doc.title}</p>
                        {doc.expiryDate && (
                          <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest">Expires: {new Date(doc.expiryDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    {doc.isSensitive && <ShieldAlert size={12} className="text-amber-600 shrink-0" />}
                  </div>
                )) : <p className="text-xs text-muted">No documents uploaded.</p>}
              </div>
            </div>
          </div>
        </section>

        {/* 5. Maps & Locations */}
        <section className="mb-12 page-break">
          <h3 className="mb-8 text-xl font-black uppercase tracking-widest flex items-center gap-3">
            <MapPin size={20} /> Navigation Info
          </h3>
          <div className="rounded-xl border-2 border-foreground p-6">
            <p className="text-sm font-bold leading-relaxed mb-6">
              Use the following links to access interactive navigation. Coordinates are provided for high-accuracy placement in your mapping app.
            </p>
            {googleMapsUrl && (
              <div className="mb-8 rounded-lg bg-surface-2 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Master Trip Route</p>
                <div className="flex items-center justify-between gap-4">
                   <p className="text-[10px] font-mono truncate text-muted">{googleMapsUrl}</p>
                   <a href={googleMapsUrl} target="_blank" className="text-foreground hover:underline whitespace-nowrap text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                     Open Route <ExternalLink size={10} />
                   </a>
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {uniquePlaces.map((place) => (
                <div key={place.id} className="flex flex-col gap-1 border-b border-border pb-3">
                  <p className="text-[10px] font-black uppercase tracking-tight">{place.name}</p>
                  <p className="text-[9px] text-muted truncate">{place.location}</p>
                  {place.latitude && place.longitude && (
                    <p className="text-[9px] font-mono text-muted mt-1">{place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Currency & Weather */}
        <section className="mb-12 page-break">
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                <CloudSun size={20} /> Weather Intel
              </h3>
              {weather ? (
                <div className="rounded-xl border border-border p-6 bg-surface-2">
                  <p className="text-lg font-black uppercase tracking-tight">{weather.summary}</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-widest">
                    <div>
                      <p className="text-muted mb-1">Temperature</p>
                      <p>{weather.temperatureRange}</p>
                    </div>
                    <div>
                      <p className="text-muted mb-1">Rain Risk</p>
                      <p>{weather.rainRisk}</p>
                    </div>
                  </div>
                  {weather.daily.length > 0 && (
                    <div className="mt-6 space-y-2">
                      {weather.daily.slice(0, 3).map((day) => (
                        <div key={day.date} className="flex items-center justify-between border-t border-border pt-2">
                          <span className="text-[10px] font-bold">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                          <span className="text-[10px] font-bold uppercase">{day.label}</span>
                          <span className="text-[10px] font-mono text-muted">{day.minC}° / {day.maxC}°</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-border p-8 text-center opacity-40">
                  <p className="text-[10px] font-black uppercase tracking-widest">Weather data unavailable</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                <Coins size={20} /> Exchange Rates
              </h3>
              {exchangeRate ? (
                <div className="rounded-xl border border-border p-6 bg-surface-2">
                  <p className="text-lg font-black uppercase tracking-tight">
                    {exchangeRate.rate > 0 
                      ? `1 ${exchangeRate.base} = ${exchangeRate.rate.toFixed(4)} ${exchangeRate.quote}`
                      : "Live rates unavailable"}
                  </p>
                  <p className="mt-2 text-[9px] font-bold uppercase text-muted tracking-widest">{exchangeRate.source.note}</p>
                  <div className="mt-8 space-y-4">
                    <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-[10px] font-bold uppercase">Base Currency</span>
                        <span className="text-[10px] font-black">{exchangeRate.base}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-[10px] font-bold uppercase">Destination</span>
                        <span className="text-[10px] font-black">{exchangeRate.quote}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-border p-8 text-center opacity-40">
                  <p className="text-[10px] font-black uppercase tracking-widest">Rate data unavailable</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 7. Emergency Notes */}
        <section className="mb-12 page-break">
          <h3 className="mb-8 text-xl font-black uppercase tracking-widest flex items-center gap-3">
            <Phone size={20} /> Emergency & Notes
          </h3>
          <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-8 min-h-[200px]">
             {trip.notes ? (
               <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-2">
                 {trip.notes}
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-rose-300 opacity-50">
                  <p className="text-[10px] font-black uppercase tracking-widest">Emergency contacts or trip notes not added</p>
               </div>
             )}
          </div>
        </section>

        {/* 8. Drive Memories */}
        <section className="mb-20 page-break">
          <h3 className="mb-8 text-xl font-black uppercase tracking-widest flex items-center gap-3">
            <HardDrive size={20} /> Cloud Access
          </h3>
          <div className="space-y-4">
            {driveSources.length > 0 ? driveSources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-2">
                <div className="flex items-center gap-4">
                  <div className="grid size-10 place-items-center rounded-lg bg-background border border-border">
                    <HardDrive size={18} className="text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">{source.folderName || "Media Folder"}</p>
                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Google Drive</p>
                  </div>
                </div>
                <a href={source.folderUrl} target="_blank" className="text-foreground hover:underline text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  Open Folder <ExternalLink size={12} />
                </a>
              </div>
            )) : (
              <p className="text-xs text-muted">No cloud memory folders linked.</p>
            )}
          </div>
        </section>

        <footer className="mt-20 border-t border-border pt-12 text-center text-[10px] font-black uppercase tracking-[0.4em] text-muted">
          Travel Guide — Generated on {today.toLocaleDateString()}
        </footer>
      </main>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-black uppercase tracking-widest text-muted">{label}</span>
      <span className="text-lg font-black uppercase tracking-tight">{value}</span>
    </div>
  );
}

function PlanBox({ label, content }: { label: string, content: string }) {
  return (
    <div className="space-y-2">
      <span className="text-[9px] font-black uppercase tracking-widest text-muted">{label}</span>
      <p className="text-sm leading-relaxed text-muted-2">{content || "No plans added."}</p>
    </div>
  );
}

function getBookingIcon(type: string) {
  switch (type) {
    case "Flight": return <Plane size={14} />;
    case "Hotel": return <Hotel size={14} />;
    case "Car rental": return <Car size={14} />;
    case "Restaurant": return <Utensils size={14} />;
    default: return <Ticket size={14} />;
  }
}


