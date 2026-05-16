import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "local@travel-guide.app" },
    update: { name: "Marwan" },
    create: {
      email: "local@travel-guide.app",
      name: "Marwan",
    },
  });

  await prisma.travelProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      travelPace: "medium",
      budgetStyle: "balanced",
      hiddenGemInterest: true,
    },
  });

  console.log("Seeded user and empty travel profile.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
