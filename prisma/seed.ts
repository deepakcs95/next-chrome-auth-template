const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Create sample plans
  const freePlan = await prisma.plan.create({
    data: {
      paypalPlanId: "P-FREE000000",
      name: "Free",
      description: "Free subscription plan with limited features",
      price: 0.0,
      currency: "USD",
      interval: "MONTH",
      isActive: true,
    },
  });

  const premiumPlan = await prisma.plan.create({
    data: {
      paypalPlanId: "P-PREMIUM12345",
      name: "Premium",
      description: "Premium subscription plan with additional features",
      price: 9.99,
      currency: "USD",
      interval: "MONTH",
      isActive: true,
    },
  });

  const proPlan = await prisma.plan.create({
    data: {
      paypalPlanId: "P-PRO67890",
      name: "Pro",
      description: "Pro subscription plan with all features",
      price: 19.99,
      currency: "USD",
      interval: "MONTH",
      isActive: true,
    },
  });

  console.log({ freePlan, premiumPlan, proPlan });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
