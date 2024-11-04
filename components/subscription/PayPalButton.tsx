"use client";

import {
  cancelSubscription,
  cancelSubscriptionUsingPlanId,
  saveSubscriptionId,
} from "@/actions/subscription";
import { useAuth } from "@clerk/nextjs";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "../ui/button";

interface PayPalButtonProps {
  planId: string;
  hasActiveSubscription: boolean;
  userId?: string | null;
  subscritptionId?: string;
}
const PayPalButton = ({
  planId,
  hasActiveSubscription,
  userId,
  subscritptionId,
}: PayPalButtonProps) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!userId) {
    return <Button onClick={() => router.push("/auth")}>Sign in to Subscribe</Button>;
  }

  const handleApprove = async (data: any, actions: any) => {
    try {
      setIsProcessing(true);
      setError(null);
      router.refresh();
    } catch (error) {
      setError("Failed to process subscription. Please try again.");
      console.error("PayPal subscription error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const initiatePayment = async (subscriptionId: string) => {
    try {
      const response = await saveSubscriptionId(subscriptionId, userId, planId);
      if (!response.success) {
        throw new Error("Failed to save subscription");
      }
      return true;
    } catch (error) {
      setError("Failed to initialize subscription. Please try again.");
      console.error("Subscription initialization error:", error);
      return false;
    }
  };

  return (
    <>
      {!hasActiveSubscription ? (
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
          onError={(e) => {
            console.log(e);
            router.refresh();
          }}
        />
      ) : (
        userId &&
        subscritptionId && (
          <div>
            <span>
              {userId}==={planId}
            </span>
            <Button onClick={async ({}) => await cancelSubscription(subscritptionId)}>
              Cancel
            </Button>
          </div>
        )
      )}
    </>
  );
};

export default PayPalButton;
