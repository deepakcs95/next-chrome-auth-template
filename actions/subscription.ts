"use server";

import prisma from "@/lib/db";
import { SubscriptionStatus } from "@/lib/types/payment-types";
import { revalidatePath } from "next/cache";

export async function saveSubscriptionId(
  subscriptionId: string,
  userId: string,
  paypalPlanId: string
) {
  try {
    if (!subscriptionId?.trim() || !userId?.trim() || !paypalPlanId?.trim()) {
      return { success: false, error: "Invalid input parameters" };
    }
    // First, find the internal plan using PayPal's plan ID
    const plan = await prisma.plan.findUnique({
      where: { paypalPlanId },
    });

    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    const userExists = await prisma.user.findUnique({
      where: { userId },
      include: {
        subscriptions: {
          where: {
            OR: [
              { status: "active" },
              {
                status: "pending",
                createdAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                },
              },
            ],
          },
        },
      },
    });

    if (!userExists) {
      console.log("user not found ", userId);

      return { success: false, error: "User not found" };
    }

    const existingActiveSub = userExists.subscriptions.find(
      (sub) => sub.status === "active" && sub.planId === plan.id
    );

    if (existingActiveSub) {
      return {
        success: false,
        error: "User already has an active subscription for this plan",
      };
    }

    // Check for recent pending subscription
    const recentPendingSub = userExists.subscriptions.find(
      (sub) =>
        sub.status === "pending" &&
        sub.planId === plan.id &&
        sub.createdAt >= new Date(Date.now() - 15 * 60 * 1000) // Within last 15 minutes
    );

    if (recentPendingSub) {
      return {
        success: false,
        error: "A pending subscription request already exists",
        pendingSubscriptionId: recentPendingSub.SubscriptionId,
      };
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

    // Check if this subscriptionId is already used
    const existingSubscription = await prisma.subscription.findUnique({
      where: { SubscriptionId: subscriptionId },
    });

    if (existingSubscription) {
      return {
        success: false,
        error: "Subscription ID already exists",
      };
    }

    const subscription = await prisma.subscription.create({
      data: {
        SubscriptionId: subscriptionId,
        status: "pending",
        userId,
        planId: plan.paypalPlanId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    revalidatePath("/");
    return { success: true, subscriptionId: subscription.SubscriptionId };
  } catch (error) {
    console.error("Failed to save subscription:", error);
    return { success: false, error: "Failed to save subscription" };
  }
}

export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: SubscriptionStatus,
  nextBillingTime?: Date,
  lastPaymentAmount?: number
) {
  try {
    if (!subscriptionId?.trim()) {
      return { success: false, error: "Invalid subscription ID" };
    }

    // Fetch current subscription state
    const currentSubscription = await prisma.subscription.findUnique({
      where: { SubscriptionId: subscriptionId },
      include: {
        plan: true,
        user: true,
      },
    });

    if (!currentSubscription) {
      return { success: false, error: "Subscription not found" };
    }

    if (!nextBillingTime || !lastPaymentAmount) {
      return {
        success: false,
        error: "Billing information required for active status",
      };
    }

    if (nextBillingTime < new Date()) {
      return {
        success: false,
        error: "Next billing time cannot be in the past",
      };
    }

    if (lastPaymentAmount <= 0) {
      return {
        success: false,
        error: "Invalid payment amount",
      };
    }

    const result = await prisma.$transaction(async (prisma) => {
      // Update subscription
      const updatedSubscription = await prisma.subscription.update({
        where: { SubscriptionId: subscriptionId },
        data: {
          status: status,
          nextBillingTime: nextBillingTime,
          lastPaymentAmount: lastPaymentAmount,
          lastPaymentTime: status === "active" ? new Date() : undefined,
          updatedAt: new Date(),
        },
        include: {
          plan: true,
          user: true,
        },
      });

      let newUserType: string;
      // Update user type based on subscription status
      if (status === "cancelled" || status === "suspended") {
        newUserType = "FREE";
      } else if (status === "active" && updatedSubscription.plan) {
        newUserType = updatedSubscription.plan.name.toUpperCase();
      } else {
        newUserType = "FREE"; // Default fallback
      }

      await prisma.user.update({
        where: { userId: updatedSubscription.userId },
        data: {
          userType: newUserType,
        },
      });

      return updatedSubscription;
    });

    return { success: true, subscription: result, userType: result.user.userType };
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
export async function cancelSubscriptionUsingPlanId({
  planId,
  userId,
}: {
  planId: string;
  userId: string;
}) {
  try {
    console.log(planId, userId);

    const subscriptionToDelete = await prisma.subscription.findFirst({
      where: {
        planId: planId,
        userId: userId,
      },
    });
    console.log(subscriptionToDelete);
    if (subscriptionToDelete) {
      const deletedSubscription = await prisma.subscription.delete({
        where: {
          id: subscriptionToDelete.id, // use the unique ID of the found subscription
        },
      });
      console.log("Subscription deleted:", deletedSubscription);

      revalidatePath("/plans");
    }
    return { success: true };
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

export async function getCurrentSubscription(userId: string) {
  try {
    return await prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: ["active", "pending"],
        },
      },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Error fetching current subscription:", error);
    return null;
  }
}
