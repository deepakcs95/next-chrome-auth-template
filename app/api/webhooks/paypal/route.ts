// app/api/webhooks/paypal/route.ts
import { headers } from "next/headers";
import { getPayPalService } from "@/lib/paypal-service";
import { NextResponse } from "next/server";
import { WebhookEvent } from "@/lib/types/payment-types";
import { WebhookHandlerFactory } from "@/lib/webhook/webhook-factory";

export async function POST(req: Request) {
  try {
    const headersList = headers();
    const payload = await req.json();
    console.log("Received Webhook Payload:", payload.event_type);

    const paypalService = await getPayPalService();
    // const isValid = await paypalService.verifyWebhookSignature(headersList, payload);
    const isValid = true;
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new NextResponse("Invalid webhook signature", { status: 401 });
    }

    const webhookEvent: WebhookEvent = {
      id: payload.id,
      type: payload.event_type,
      data: payload,
      provider: "paypal",
      timestamp: new Date(payload.create_time),
    };

    const handler = WebhookHandlerFactory.getHandler("paypal");
    switch (payload.event_type) {
      case "BILLING.SUBSCRIPTION.CREATED":
        // await handler.handleSubscriptionCreated(webhookEvent);
        break;
      case "PAYMENT.SALE.COMPLETED":
        await handler.handlePaymentCompleted(webhookEvent);
        break;
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        // await handler.handleSubscriptionUpdated(webhookEvent);
        break;
      case "BILLING.SUBSCRIPTION.CANCELLED":
        await handler.handleSubscriptionCancelled(webhookEvent);
        break;
      default:
        console.log(`Unhandled webhook event type: ${payload.event_type}`);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
