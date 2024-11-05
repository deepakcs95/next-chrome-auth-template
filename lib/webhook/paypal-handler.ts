import { getPlanByAmount, getPlanById } from "@/actions/plans";
import { prisma } from "../db";
import { PaymentWebhookHandler, SubscriptionStatus, WebhookEvent } from "../types/payment-types";
import { saveSubscriptionId, updateSubscriptionStatus } from "@/actions/subscription";

export class PayPalWebhookHandler implements PaymentWebhookHandler {
  async handleSubscriptionCreated(event: WebhookEvent): Promise<void> {
    const resource = event.data.resource;
    await saveSubscriptionId(resource.id, resource.custom_id, resource.plan_id, resource.status);
  }

  async handleSubscriptionUpdated(event: WebhookEvent): Promise<void> {
    console.log("handleSubscriptionUpdated", event);

    const resource = event.data.resource;
    const nextBillingTime = resource.billing_info?.next_billing_time
      ? new Date(resource.billing_info.next_billing_time)
      : new Date();

    await updateSubscriptionStatus({
      userId: resource.custom,
      status: this.mapPayPalStatus(resource.status),
      paypalPlanId: resource.plan_id,
      nextBillingTime: nextBillingTime ? new Date(nextBillingTime) : undefined,
      lastPaymentAmount: resource.amount.total,
    });
  }

  async handleSubscriptionCancelled(event: WebhookEvent): Promise<void> {
    const resource = event.data.resource;
    // await updateSubscriptionStatus(resource.id, "CANCELLED");
  }

  private mapPayPalStatus(paypalStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      APPROVAL_PENDING: "PENDING",
      APPROVED: "ACTIVE",
      ACTIVE: "ACTIVE",
      SUSPENDED: "SUSPENDED",
      CANCELLED: "CANCELLED",
      EXPIRED: "CANCELLED",
    };
    return statusMap[paypalStatus] || "FAILED";
  }

  async handlePaymentCompleted(event: WebhookEvent): Promise<void> {
    const resource = event.data.resource;
    const SubscriptionId = resource.billing_agreement_id;
    const userId = resource.custom;
    const lastPaymentTime = resource.create_time ? new Date(resource.create_time) : new Date();

    try {
      const { success, plan } = await getPlanByAmount(9.99);
      console.log("plan", plan);
      if (!success || !plan) {
        console.error("Failed to fetch plan:", plan);
        return;
      }
      const planId = plan.paypalPlanId;

      const intervalCount = plan.interval === "MONTH" ? 30 : 365;

      const nextBillingTime = new Date(
        lastPaymentTime.getTime() + intervalCount * 24 * 60 * 60 * 1000
      );

      await updateSubscriptionStatus({
        userId,
        status: "PAYMENT_RECEIVED",
        SubscriptionId,
        planId,
        lastPaymentTime,
        nextBillingTime,
        lastPaymentAmount: Number(resource.amount.total),
        webhookEvent: event,
      });
    } catch (error) {
      console.error("TODO: Retry the webhook:", error);
    }
  }
}
