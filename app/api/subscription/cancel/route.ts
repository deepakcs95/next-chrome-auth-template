import { cancelSubscription } from "@/lib/webhook/db-handler";
import { getPayPalService } from "@/lib/webhook/paypal-service";

import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  //cancel subscription

  const { userId, subscriptionId, reason } = await req.json();

  if (!userId || !subscriptionId) {
    return new NextResponse("Missing userId or subscriptionId", { status: 400 });
  }

  console.log(userId, subscriptionId);

  const user = await currentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (user.id !== userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const response = await cancelSubscription(subscriptionId);

  const paypalService = await getPayPalService();
  await paypalService.makeRequest(`/v1/billing/subscriptions/${subscriptionId}/cancel`, "POST", {
    reason: reason || "Not satisfied with the service",
  });

  return NextResponse.json(response);
}

// fetch('https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-BW452GLLEP1G/cancel', {
//     method: 'POST',
//     headers: {
//         'Authorization': 'Bearer access_token6V7rbVwmlM1gFZKW_8QtzWXqpcwQ6T5vhEGYNJDAAdn3paCgRpdeMdVYmWzgbKSsECednupJ3Zx5Xd-g',
//         'Content-Type': 'application/json',
//         'Accept': 'application/json'
//     },
//     body: JSON.stringify({ "reason": "Not satisfied with the service" })
// });
