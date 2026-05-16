import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const trips = await prisma.trip.findMany({
    orderBy: { updatedAt: "desc" },
    include: { destinationIntel: true }
  });
  
  console.log("TRIPS FOUND:", trips.length);
  trips.forEach(t => {
    console.log(`TRIP: ${t.id} (${t.destination}, ${t.destinationCountry}) - Intel: ${!!t.destinationIntel}`);
  });
  
  await prisma.$disconnect();
}

check();
