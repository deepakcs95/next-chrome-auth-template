import { PaymentWebhookHandler, SubscriptionStatus, WebhookEvent } from "../types/payment-types";
import { saveSubscriptionId, updateSubscriptionStatus } from "@/actions/subscription";

export class PayPalWebhookHandler implements PaymentWebhookHandler {
  async handleSubscriptionCreated(event: WebhookEvent): Promise<void> {
    const resource = event.data.resource;
    await saveSubscriptionId(resource.id, resource.subscriber.payer_id, resource.plan_id);
  }

  async handleSubscriptionUpdated(event: WebhookEvent): Promise<void> {
    const resource = event.data.resource;
    const nextBillingTime = resource.billing_info?.next_billing_time
      ? new Date(resource.billing_info.next_billing_time)
      : undefined;

    await updateSubscriptionStatus(
      resource.id,
      this.mapPayPalStatus(resource.status),
      nextBillingTime
    );
  }

  async handleSubscriptionCancelled(event: WebhookEvent): Promise<void> {
    const resource = event.data.resource;
    await updateSubscriptionStatus(resource.id, "cancelled");
  }

 

  private mapPayPalStatus(paypalStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      APPROVAL_PENDING: "pending",
      APPROVED: "active",
      ACTIVE: "active",
      SUSPENDED: "suspended",
      CANCELLED: "cancelled",
      EXPIRED: "cancelled",
    };
    return statusMap[paypalStatus] || "failed";
  }
}
