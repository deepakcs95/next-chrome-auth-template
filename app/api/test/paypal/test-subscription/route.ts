import { getPayPalService } from "@/lib/paypal-service";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // You can replace this with an actual subscription ID from your system
    const testSubscriptionId = "I-BW452GLLEP1G";

    const paypal = await getPayPalService();
    const subscription = await paypal.makeRequest(
      `/v1/billing/subscriptions/${testSubscriptionId}`
    );

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("PayPal subscription test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch subscription details",
      },
      { status: 500 }
    );
  }
}
