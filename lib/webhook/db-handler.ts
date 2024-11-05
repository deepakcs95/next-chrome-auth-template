"use server";

import { prisma } from "@/lib/db";
import { SubscriptionStatus, WebhookEvent } from "@/lib/types/payment-types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getPayPalService } from "./paypal-service";

export async function saveSubscriptionId(
  subscriptionId: string,
  userId: string,
  paypalPlanId: string,
  status: SubscriptionStatus
) {
  try {
    if (!subscriptionId?.trim() || !userId?.trim() || !paypalPlanId?.trim() || !status) {
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
              { status: "ACTIVE" },
              {
                status: "APPROVAL_PENDING",
                createdAt: {
                  gte: new Date(Date.now() - 30 * 1000), // 30 seconds
                },
              },
            ],
          },
        },
      },
    });

    if (userExists) {
      console.log("user not found ", userId);

      return { success: false, error: "User not found" };
    }
  } catch (error) {
    console.error("Failed to save subscription:", error);
    return { success: false, error: "Failed to save subscription" };
  }
}

export async function updateSubscriptionStatus({
  userId,
  status,
  planId,
  SubscriptionId,
  nextBillingTime,
  lastPaymentAmount,
  lastPaymentTime,
  webhookEvent,
}: {
  userId: string;
  status: SubscriptionStatus;
  planId: string;
  SubscriptionId: string;
  nextBillingTime: Date;
  lastPaymentTime: Date;
  lastPaymentAmount: number;
  webhookEvent: WebhookEvent;
}) {
  console.log(
    "userId",
    userId,
    "status",
    status,
    "planId",
    planId,
    "SubscriptionId",
    SubscriptionId,
    "status",
    status,
    "nextBillingTime",
    nextBillingTime,
    "lastPaymentAmount",
    lastPaymentAmount,
    "lastPaymentTime",
    lastPaymentTime
  );

  //   return;

  try {
    switch (status) {
      case "ACTIVATED":
        try {
          const existingSubscription = await prisma.subscription.findFirst({
            where: {
              userId,
              SubscriptionId,
              status: {
                in: ["ACTIVE"],
              },
            },
          });

          if (existingSubscription) {
            console.error("Subscription already exists plase request to cancel");
            return;
          }

          await prisma.$transaction(async (tx) => {
            const subscription = await tx.subscription.upsert({
              where: { SubscriptionId },
              update: {
                status,
                nextBillingTime,
                currentPeriodEnd: nextBillingTime,
                lastPaymentAmount,
              },
              create: {
                userId,
                planId,
                SubscriptionId,
                status,
                nextBillingTime,
                currentPeriodStart: new Date(),
                currentPeriodEnd: nextBillingTime,
                lastPaymentAmount,
              },
            });

            const plan = await tx.plan.findUnique({
              where: { paypalPlanId: planId },
            });

            if (plan) {
              await tx.user.update({
                where: { userId },
                data: {
                  userType: plan.name, // Assuming plan has a type field (FREE, PREMIUM, ENTERPRISE)
                },
              });
            }
          });
          console.log("✅ Transaction successful, subscription created successfully");
        } catch (error) {
          console.error("❌ Failed to update subscription:", error);
          return { success: false, error: "Failed to update subscription" };
        }
        break;
      case "APPROVAL_PENDING":
        break;
      case "PAYMENT_RECEIVED":
        const subscription = await prisma.subscription.findFirst({
          where: {
            userId,
            SubscriptionId,
          },
          include: {
            plan: true,
          },
        });

        if (!subscription) {
          try {
            await prisma.$transaction(async (tx) => {
              // Check if webhookEvent and its resource are defined
              const newSubscription = await tx.subscription.create({
                data: {
                  userId,
                  planId,
                  SubscriptionId,
                  status,
                  nextBillingTime,
                  lastPaymentAmount,
                  lastPaymentTime,
                },
              });

              await tx.payment.create({
                data: {
                  subscriptionId: newSubscription.id,
                  status: webhookEvent.data.resource.state || "PENDING",
                  amount: lastPaymentAmount!,
                },
              });
            });
            console.log("✅ Transaction successful, payment created successfully");
          } catch (error) {
            console.error("❌ Transaction failed, please retry the webhook:", error);
            throw new Error("Transaction failed, please retry the webhook");
          }
        } else {
        }

        break;
      case "CANCELLED":
        break;
    }
  } catch (error) {
    console.error("❌ Failed to update subscription:", error);
    return { success: false, error: "Failed to update subscription" };
  }
}

export async function getCurrentSubscription(userId: string) {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: ["ACTIVE", "PENDING"],
        },
      },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Return both subscription and plan
    return {
      success: true,
      subscription: subscription,
    };
  } catch (error) {
    console.error("Error fetching current subscription:", error);
    return { success: false, error: "Failed to fetch subscription" };
  }
}

export async function handleCancelledSubscription(
  userId: string,
  SubscriptionId: string,
  planId: string
) {
  try {
    console.log("userId", userId, "SubscriptionId", SubscriptionId, "planId", planId);
    const subscription = await prisma.subscription.update({
      where: { userId, planId, SubscriptionId },
      data: {
        status: "CANCELLED",
      },
    });

    console.log("✅ Successfully cancelled subscription", subscription);
  } catch (error) {
    console.error("❌ Error handling cancelled subscription:", error);
    return { success: false, error: "Failed to handle cancelled subscription" };
  }
}

export async function cancelSubscription(subscriptionId: string) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const paypalService = await getPayPalService();
  console.log("userId", userId, subscriptionId);
  const response = await paypalService.makeRequest(
    `/v1/billing/subscriptions/${subscriptionId}/cancel`,
    "POST",
    {
      reason: "Not satisfied with the service",
    }
  );

  revalidatePath("/");
  return { success: true, data: response };
}
