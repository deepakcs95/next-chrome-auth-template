"use server";

import { prisma } from "@/lib/db";
import { SubscriptionStatus, WebhookEvent } from "@/lib/types/payment-types";
import { revalidatePath } from "next/cache";

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

  try {
    switch (status) {
      case "ACTIVE":
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
          } catch (error) {
            console.error("Transaction failed, please retry the webhook:", error);
            throw new Error("Transaction failed, please retry the webhook");
          }
        } else {
        }

        break;
      case "CANCELLED":
        break;
    }
  } catch (error) {
    console.error("Failed to update subscription:", error);
    return { success: false, error: "Failed to update subscription" };
  }
}

// export async function cancelSubscription(subscriptionId: string) {
//   try {
//     const subscription = await prisma.subscription.update({
//       where: { SubscriptionId: subscriptionId },
//       data: {
//         status: "cancelled",
//       },
//     });

//     // Reset user type to FREE
//     await prisma.user.update({
//       where: { userId: subscription.userId },
//       data: { userType: "FREE" },
//     });

//     return { success: true, subscription };
//   } catch (error) {
//     console.error("Failed to cancel subscription:", error);
//     return { success: false, error: "Failed to cancel subscription" };
//   }
// }
// export async function cancelSubscriptionUsingPlanId({
//   planId,
//   userId,
// }: {
//   planId: string;
//   userId: string;
// }) {
//   try {
//     console.log(planId, userId);

//     const subscriptionToDelete = await prisma.subscription.findFirst({
//       where: {
//         planId: planId,
//         userId: userId,
//       },
//     });
//     console.log(subscriptionToDelete);
//     if (subscriptionToDelete) {
//       const deletedSubscription = await prisma.subscription.delete({
//         where: {
//           id: subscriptionToDelete.id, // use the unique ID of the found subscription
//         },
//       });
//       console.log("Subscription deleted:", deletedSubscription);

//       revalidatePath("/plans");
//     }
//     return { success: true };
//   } catch (error) {
//     console.error("Failed to cancel subscription:", error);
//     return { success: false, error: "Failed to cancel subscription" };
//   }
// }

// export async function cleanupPendingSubscriptions() {
//   try {
//     // Delete pending subscriptions older than 24 hours
//     const result = await prisma.subscription.deleteMany({
//       where: {
//         status: "PENDING",
//         createdAt: {
//           lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
//         },
//       },
//     });
//     return { success: true, deletedCount: result.count };
//   } catch (error) {
//     console.error("Failed to cleanup pending subscriptions:", error);
//     return { success: false, error: "Failed to cleanup pending subscriptions" };
//   }
// }

// export async function getUserSubscription(userId: string) {
//   try {
//     const subscription = await prisma.subscription.findFirst({
//       where: {
//         userId,
//         status: "ACTIVE",
//       },
//       include: {
//         plan: true,
//       },
//     });
//     return { success: true, subscription };
//   } catch (error) {
//     console.error("Failed to fetch user subscription:", error);
//     return { success: false, error: "Failed to fetch user subscription" };
//   }
// }

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
