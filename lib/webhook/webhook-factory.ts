import { PaymentProvider, PaymentWebhookHandler } from "../types/payment-types";
import { PayPalWebhookHandler } from "./paypal-handler";

export class WebhookHandlerFactory {
  static getHandler(provider: PaymentProvider): PaymentWebhookHandler {
    switch (provider) {
      case "paypal":
        return new PayPalWebhookHandler();
      // Add Stripe handler when needed
      // case 'stripe':
      //   return new StripeWebhookHandler();
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }
}
