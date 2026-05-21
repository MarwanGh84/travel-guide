import { BookingsWorkspace } from "@/components/travel/bookings-workspace";
import { getPrimaryTrip, ensureBookingChecklist } from "@/lib/db/travel";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const trip = await getPrimaryTrip();
  if (trip && trip.bookingChecklist.length === 0) {
    const freshChecklist = await ensureBookingChecklist(trip.id);
    if (freshChecklist) {
      trip.bookingChecklist = freshChecklist;
    }
  }

  const bookings = trip
    ? trip.bookings.map((booking) => ({
        id: booking.id,
        title: booking.title,
        type: booking.type,
        provider: booking.provider,
        confirmationNumber: booking.confirmationNumber,
        date: booking.startAt?.toISOString().slice(0, 10),
        endDate: booking.endAt?.toISOString().slice(0, 10),
        link: booking.link,
        notes: booking.notes,
        importGroupId: booking.importGroupId,
      }))
    : [];

  const checklist = trip?.bookingChecklist ?? [];
  const itineraryApproved = trip?.status === "itinerary_approved";

  return (
    <BookingsWorkspace 
      bookings={bookings} 
      tripName={trip?.destination || "Global"} 
      checklist={checklist}
      itineraryApproved={itineraryApproved}
    />
  );
}
