import { getPayPalService } from "@/lib/paypal-service";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const paypal = await getPayPalService();
    const auth = await paypal.getAuthToken();

    // Make a simple request to test authentication
    await paypal.makeRequest("/v1/catalogs/products");

    return NextResponse.json({
      success: true,
      data: {
        message: "Successfully authenticated with PayPal",
        auth,
      },
    });
  } catch (error) {
    console.error("PayPal auth test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Authentication failed",
      },
      { status: 500 }
    );
  }
}
