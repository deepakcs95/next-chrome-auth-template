"use client";

import { saveSubscriptionId } from "@/actions/subscription";
import { useAuth } from "@clerk/nextjs";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import React from "react";

interface PayPalButtonProps {
  planId: string;
}
const PayPalButton = ({ planId }: PayPalButtonProps) => {
  const { isSignedIn, userId } = useAuth();

  const router = useRouter();

  const handleApprove = async (data: any, actions: any) => {
    try {
      if (!isSignedIn || !userId) {
        router.push("/auth");
        return;
      }
    } catch (error) {
      console.error("PayPal subscription error:", error);
    }
  };
  const initiatePayment = async (subscriptionId: string) => {
    if (!isSignedIn || !userId) {
      router.push("/auth");
      return false;
    }

    const response = await saveSubscriptionId(subscriptionId, userId, planId);
    if (!response.success) {
      console.error("Failed to save initial subscription");
      return false;
    }
    return true;
  };
  return (
    <PayPalButtons
      style={{ layout: "vertical" }}
      createSubscription={async (data, actions) => {
        const subscriptionId = await actions.subscription.create({
          plan_id: planId,
        });

        initiatePayment(subscriptionId);

        return subscriptionId;
      }}
      onApprove={handleApprove}
      onError={(e) => console.log(e)}
    />
  );
};

export default PayPalButton;
