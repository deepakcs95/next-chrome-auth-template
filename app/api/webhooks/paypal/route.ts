// app/api/webhooks/paypal/route.ts
import { headers } from "next/headers";
import { getPayPalService } from "@/lib/paypal-service";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const headersList = headers();
    const payload = await req.json();

    console.log("Received Webhook Payload:", JSON.stringify(payload, null, 2));

    const paypalService = await getPayPalService();
    const isValid = await paypalService.verifyWebhookSignature(headersList, payload);

    if (!isValid) {
      console.error("Invalid webhook signature");
      return new NextResponse("Invalid webhook signature", { status: 401 });
    }

    // Process the webhook based on event type
    const eventType = payload.event_type;
    console.log("Processing webhook event:", eventType);

    // Add your webhook processing logic here

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
