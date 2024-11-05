"use client";

import { cancelSubscription } from "@/lib/webhook/db-handler";
import { useAuth } from "@clerk/nextjs";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useFormStatus } from "react-dom";

interface PayPalButtonProps {
  planId: string;
  hasActiveSubscription: boolean;
  userId?: string | null;
  status?: string;
  subscritptionId?: string | null;
}
const PayButton = ({
  planId,
  hasActiveSubscription,
  userId,
  status,
  subscritptionId,
}: PayPalButtonProps) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { pending } = useFormStatus();
  const toast = useToast();
  const showToast = (toast as any).toast || toast;

  if (!userId) {
    return (
      <Link href="/auth/sign-in">
        <Button className="w-full ">Sign in to Subscribe</Button>
      </Link>
    );
  }
  // console.log(userId, planId, hasActiveSubscription, status, subscritptionId);

  const handleApprove = async (data: any, actions: any) => {
    showToast({
      title: "Payment successful",
      description: "Your subscription has been activated",
    });
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

  return (
    <>
      {!hasActiveSubscription ? (
        <PayPalButtons
          style={{ layout: "vertical" }}
          createSubscription={async (data, actions) => {
            return actions.subscription.create({
              plan_id: planId,
              custom_id: userId,
            });
          }}
          onApprove={handleApprove}
          onError={(e) => {
            console.log(e);
            router.refresh();
          }}
        />
      ) : (
        userId && (
          <div>
            <span>
              {userId}==={planId}
            </span>

            <Button disabled={pending} onClick={() => cancelSubscription(subscritptionId!)}>
              {pending
                ? "Waiting..."
                : status === "ACTIVATED"
                ? "Cancel Subscription"
                : status === "PAYMENT_RECEIVED" || status === "APPROVAL_PENDING"
                ? "Pending"
                : "Cancel Subscription"}
            </Button>
          </div>
        )
      )}
    </>
  );
};

export default PayButton;
