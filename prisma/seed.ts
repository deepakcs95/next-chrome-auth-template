const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.$transaction([
    prisma.invoice.deleteMany({}),
    prisma.usage.deleteMany({}),
    prisma.planFeature.deleteMany({}),
    prisma.subscription.deleteMany({}),
    prisma.plan.deleteMany({}),
    prisma.user.deleteMany({}),
    prisma.paypalToken.deleteMany({}),
  ]);

  // Create Users
  const user1 = await prisma.user.create({
    data: {
      userId: "user_123",
      email: "john@example.com",
      name: "John Doe",
      userType: "FREE",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      userId: "user_456",
      email: "jane@example.com",
      name: "Jane Smith",
      userType: "PREMIUM",
    },
  });

  // Create Plans
  const monthlyPlan = await prisma.plan.create({
    data: {
      paypalPlanId: "P-5ML4271244454362WXNWU5NQ",
      name: "Premium Monthly",
      description: "Premium features with monthly billing",
      price: 9.99,
      interval: "MONTH",
      features: {
        create: [
          {
            name: "API Calls",
            description: "Number of API calls per month",
            limit: 1000,
          },
          {
            name: "Storage",
            description: "Storage limit in GB",
            limit: 10,
          },
        ],
      },
    },
  });

  // Create Subscriptions
  const subscription1 = await prisma.subscription.create({
    data: {
      userId: user2.userId,
      planId: monthlyPlan.paypalPlanId,
      SubscriptionId: "I-BW452GLLEP1G",
      status: "ACTIVE",
      nextBillingTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      lastPaymentAmount: 9.99,
      lastPaymentTime: new Date(),
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Create Usage Records
  await prisma.usage.create({
    data: {
      subscriptionId: subscription1.id,
      featureId: "api_calls",
      count: 150,
    },
  });

  // Create Invoice
  await prisma.invoice.create({
    data: {
      subscriptionId: subscription1.id,
      amount: 9.99,
      status: "PAID",
      paypalInvoiceId: "INV2-XXXX-YYYY-ZZZZ",
      billingPeriodStart: new Date(),
      billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paidAt: new Date(),
    },
  });

  // Create PayPal Token
  await prisma.paypalToken.create({
    data: {
      accessToken: "A21AAIkqHh9xHLqxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
