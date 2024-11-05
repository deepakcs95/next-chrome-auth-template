import { getPlanByAmount, getPlanById } from "@/actions/plans";
import { prisma } from "../db";
import { PaymentWebhookHandler, SubscriptionStatus, WebhookEvent } from "../types/payment-types";
import {
  handleCancelledSubscription,
  saveSubscriptionId,
  updateSubscriptionStatus,
} from "./db-handler";

export class PayPalWebhookHandler implements PaymentWebhookHandler {
  async handleSubscriptionCreated(event: WebhookEvent): Promise<void> {
    const resource = event.data.resource;
    await saveSubscriptionId(resource.id, resource.custom_id, resource.plan_id, resource.status);
  }

  async handleSubscriptionUpdated(event: WebhookEvent): Promise<void> {
    console.log("handleSubscriptionUpdated", event);
    const userId = event.data.resource.custom_id;
    const status = "ACTIVATED";
    const planId = event.data.resource.plan_id;
    const SubscriptionId = event.data.resource.id;

    const nextBillingTime = event.data.resource.billing_info?.next_billing_time
      ? new Date(event.data.resource.billing_info.next_billing_time)
      : new Date();
    const lastPaymentAmount = Number(event.data.resource.billing_info.last_payment.amount.value);

    if (!status || !userId || !planId || !SubscriptionId) {
      console.error("Missing required fields in subscription updated event");
      return;
    }

    await updateSubscriptionStatus({
      userId,
      status,
      planId,
      SubscriptionId,
      nextBillingTime,
      lastPaymentTime: new Date(),
      lastPaymentAmount,
      webhookEvent: event,
    });
  }

  async handleSubscriptionCancelled(event: WebhookEvent): Promise<void> {
    const resource = event.data.resource;
    const userId = resource.custom_id;
    const SubscriptionId = resource.id;
    const planId = resource.plan_id;

    await handleCancelledSubscription(userId, SubscriptionId, planId);
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
