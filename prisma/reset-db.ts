import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log("🧹 Wiping all demo data for fresh installation...");

  try {
    await prisma.billItem.deleteMany({});
    console.log("✓ Cleared BillItem");

    await prisma.payment.deleteMany({});
    console.log("✓ Cleared Payment");

    await prisma.cancellation.deleteMany({});
    console.log("✓ Cleared Cancellation");

    await prisma.dayClosing.deleteMany({});
    console.log("✓ Cleared DayClosing");

    await prisma.bill.deleteMany({});
    console.log("✓ Cleared Bill");

    await prisma.stock.deleteMany({});
    console.log("✓ Cleared Stock");

    await prisma.foodPortion.deleteMany({});
    console.log("✓ Cleared FoodPortion");

    await prisma.foodItem.deleteMany({});
    console.log("✓ Cleared FoodItem");

    await prisma.category.deleteMany({});
    console.log("✓ Cleared Category");

    await prisma.user.deleteMany({});
    console.log("✓ Cleared User");

    console.log("🎉 Database is now completely clean and ready for fresh onboarding!");
  } catch (error) {
    console.error("Error wiping database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
