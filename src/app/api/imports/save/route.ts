import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getPrimaryTrip, parseDateField } from "@/lib/db/travel";
import { SaveImportsSchema } from "@/lib/validation/schemas";
import type { ParsedTravelEmail } from "@/lib/imports/travelEmailParser";

export async function POST(request: Request) {
  const trip = await getPrimaryTrip();
  if (!trip) return NextResponse.json({ ok: false, message: "Create a trip before importing bookings." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const validation = SaveImportsSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ ok: false, message: "Invalid import data format." }, { status: 400 });
  }

  const selected = validation.data.imports as unknown as ParsedTravelEmail[];
  if (!selected.length) {
    return NextResponse.json({ ok: false, message: "No valid parsed bookings selected." }, { status: 400 });
  }

  let imported = 0;
  let skipped = 0;

  const importGroupId = Date.now().toString();

  for (const item of selected) {
    const fingerprint = importFingerprint(item);
    const existing = await findDuplicateImport(trip.id, item, fingerprint);
    if (existing) {
      skipped++;
      continue;
    }

    imported++;
    const booking = await prisma.booking.create({
      data: {
        tripId: trip.id,
        type: item.bookingType,
        title: item.title,
        provider: item.provider,
        confirmationNumber: item.confirmationNumber,
        startAt: item.startDate ? parseDateField(item.startDate) : null,
        endAt: item.endDate ? parseDateField(item.endDate) : null,
        link: item.link,
        notes: bookingNotes(item),
        importGroupId,
        importFingerprint: fingerprint,
        sourceMessageId: item.sourceId,
      },
    });

    await prisma.documentNote.create({
      data: {
        tripId: trip.id,
        type: item.bookingType,
        title: `Voucher: ${item.title}`,
        content: documentContent(item),
        link: item.link,
        importGroupId,
        importFingerprint: fingerprint,
        sourceMessageId: item.sourceId,
      },
    });

    await prisma.apiProviderLog.create({
      data: {
        tripId: trip.id,
        userId: trip.userId,
        provider: "gmail-import",
        endpoint: "imports:save",
        status: "success",
        usedMock: false,
        message: `Imported ${booking.title} from ${item.provider}.`,
      },
    });
  }

  return NextResponse.json({ ok: true, count: imported, skipped });
}

async function findDuplicateImport(tripId: string, item: ParsedTravelEmail, fingerprint: string) {
  return prisma.booking.findFirst({
    where: {
      tripId,
      OR: [
        { importFingerprint: fingerprint },
        ...(item.sourceId ? [{ sourceMessageId: item.sourceId }] : []),
        ...(item.confirmationNumber
          ? [{ provider: item.provider, confirmationNumber: item.confirmationNumber }]
          : []),
      ],
    },
    select: { id: true },
  });
}

function importFingerprint(item: ParsedTravelEmail) {
  return item.importFingerprint || [
    item.provider,
    item.bookingType,
    item.confirmationNumber || item.sourceId || item.sourceSubject || item.title,
    item.startDate ?? "",
    item.endDate ?? "",
  ].join("|").toLowerCase().replace(/[^a-z0-9|:-]+/g, "-").slice(0, 180);
}

function bookingNotes(item: ParsedTravelEmail) {
  return [
    item.address ? `Address: ${item.address}` : "",
    item.price ? `Price: ${item.price}` : "",
    item.guestName ? `Guest: ${item.guestName}` : "",
    item.cancellationNotes ? `Cancellation: ${item.cancellationNotes}` : "",
    item.sourceSubject ? `Source subject: ${item.sourceSubject}` : "",
    item.sourceId ? `Gmail message: ${item.sourceId}` : "",
  ].filter(Boolean).join("\n");
}

function documentContent(item: ParsedTravelEmail) {
  return [
    `Provider: ${item.provider}`,
    `Type: ${item.bookingType}`,
    item.confirmationNumber ? `Confirmation: ${item.confirmationNumber}` : "",
    item.startDate ? `Start: ${item.startDate}` : "",
    item.endDate ? `End: ${item.endDate}` : "",
    item.address ? `Address: ${item.address}` : "",
    item.price ? `Price: ${item.price}` : "",
    item.cancellationNotes ? `Cancellation: ${item.cancellationNotes}` : "",
    item.sourceId ? `Gmail message: ${item.sourceId}` : "",
    `Import fingerprint: ${importFingerprint(item)}`,
    "",
    "Imported from email preview.",
    item.rawSnippet,
  ].filter(Boolean).join("\n");
}
