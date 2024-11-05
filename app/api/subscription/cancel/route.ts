import { cancelSubscriptionUsingPlanId } from "@/actions/subscription";

import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  //cancel subscription

  const { userId, subscriptionId } = await req.json();

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

  const response = await cancelSubscriptionUsingPlanId({ userId, planId: subscriptionId });

  return NextResponse.json(response);
}
