export type PaymentProvider = "paypal" | "stripe";

export type WebhookEvent = {
  id: string;
  type: string;
  data: Record<string, any>;
  provider: PaymentProvider;
  timestamp: Date;
};

export type SubscriptionStatus = "pending" | "active" | "cancelled" | "suspended" | "failed";

export interface PaymentWebhookHandler {
  handleSubscriptionCreated(event: WebhookEvent): Promise<void>;
  handleSubscriptionUpdated(event: WebhookEvent): Promise<void>;
  handleSubscriptionCancelled(event: WebhookEvent): Promise<void>;
}
