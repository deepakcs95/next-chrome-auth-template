"use server";

import prisma from "@/lib/db";

export async function saveSubscriptionId(
  subscriptionId: string,
  userId: string,
  paypalPlanId: string
) {
  try {
    // First, find the internal plan using PayPal's plan ID
    const plan = await prisma.plan.findUnique({
      where: { paypalPlanId },
    });

    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    // Check for existing pending subscriptions and clean them up
    await prisma.subscription.deleteMany({
      where: {
        userId,
        status: "pending",
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });
    console.log(plan.id);

    const subscription = await prisma.subscription.create({
      data: {
        SubscriptionId: subscriptionId,
        status: "pending", // Always start with pending status
        userId,
        planId: plan.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to save subscription:", error);
    return { success: false, error: "Failed to save subscription" };
  }
}

export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: "active" | "cancelled" | "suspended" | "failed",
  nextBillingTime?: Date,
  lastPaymentAmount?: number
) {
  try {
    const subscription = await prisma.subscription.update({
      where: { SubscriptionId: subscriptionId },
      data: {
        status,
        nextBillingTime: nextBillingTime,
        lastPaymentAmount: lastPaymentAmount,
        lastPaymentTime: status === "active" ? new Date() : undefined,
      },
      include: {
        plan: true,
        user: true,
      },
    });

    // Update user type based on subscription status
    if (status === "cancelled" || status === "suspended") {
      await prisma.user.update({
        where: { userId: subscription.userId },
        data: { userType: "FREE" },
      });
    } else if (status === "active" && subscription.plan) {
      await prisma.user.update({
        where: { userId: subscription.userId },
        data: { userType: subscription.plan.name.toUpperCase() },
      });
    }

    return { success: true, subscription };
  } catch (error) {
    console.error("Failed to update subscription:", error);
    return { success: false, error: "Failed to update subscription" };
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await prisma.subscription.update({
      where: { SubscriptionId: subscriptionId },
      data: {
        status: "cancelled",
      },
    });

    // Reset user type to FREE
    await prisma.user.update({
      where: { userId: subscription.userId },
      data: { userType: "FREE" },
    });

    return { success: true, subscription };
  } catch (error) {
    console.error("Failed to cancel subscription:", error);
    return { success: false, error: "Failed to cancel subscription" };
  }
}

export async function cleanupPendingSubscriptions() {
  try {
    // Delete pending subscriptions older than 24 hours
    const result = await prisma.subscription.deleteMany({
      where: {
        status: "pending",
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });
    return { success: true, deletedCount: result.count };
  } catch (error) {
    console.error("Failed to cleanup pending subscriptions:", error);
    return { success: false, error: "Failed to cleanup pending subscriptions" };
  }
}

export async function getUserSubscription(userId: string) {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "active",
      },
      include: {
        plan: true,
      },
    });
    return { success: true, subscription };
  } catch (error) {
    console.error("Failed to fetch user subscription:", error);
    return { success: false, error: "Failed to fetch user subscription" };
  }
}
