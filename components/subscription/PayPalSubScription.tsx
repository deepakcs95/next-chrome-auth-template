"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useSubscriptionStore } from "@/lib/store";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PlanDetails {
  id: string;
  name: string;
  price: number;
  features: string[];
}

const SUBSCRIPTION_PLANS: Record<string, PlanDetails> = {
  pro: {
    id: "PROD-7E423270HV0866009",
    name: "Pro Plan",
    price: 9.99,
    features: ["Advanced Analytics", "Priority Support", "Custom Branding"],
  },
  enterprise: {
    id: "PROD-7E423270HV0866009",
    name: "Enterprise Plan",
    price: 29.99,
    features: ["All Pro Features", "Dedicated Account Manager", "API Access", "24/7 Support"],
  },
};

export function PayPalSubscribe({ planId }: { planId: string }) {
  const [loading, setLoading] = useState(false);
  const { setTier, setActive, setExpiration } = useSubscriptionStore();
  const { toast } = useToast();

  const plan = SUBSCRIPTION_PLANS[planId];

  if (!plan) return null;

  const handleApprove = async (data: any, actions: any) => {
    setLoading(true);
    try {
      const details = await actions.subscription.get();

      // Set subscription details in store
      setTier(planId as any);
      setActive(true);
      setExpiration(new Date(details.billing_info.next_billing_time).toISOString());

      toast({
        title: "Subscription activated!",
        description: `You now have access to the ${plan.name}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem activating your subscription.",
        variant: "destructive",
      });
      console.error("PayPal subscription error:", error);
    }
    setLoading(false);
  };

  return (
    <PayPalScriptProvider
      options={{
        clientId:
          "AVO7uhq_cD1n7bc_xj2Yuke7EQWxVcmGcD9u78YiAA5yTArT5XmjO_i3LRPVBWFjd4jhEfpkTMZ7a5H6",
        currency: "USD",
        vault: true,
        intent: "subscription",
        environment: "sandbox",
      }}
    >
      <div className="w-full max-w-sm mx-auto">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow duration-200">
          <div className="p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">{plan.name}</h3>
            <div className="mt-4">
              <span className="text-3xl font-bold">${plan.price}</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <svg
                    className="h-5 w-5 text-emerald-500 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 pt-0">
            <PayPalButtons
              style={{ layout: "vertical" }}
              createSubscription={async (data, actions) => {
                const subscriptionResult = await actions.subscription.create({
                  plan_id: "P-1GR3799935687233AM4S6O3I",
                });

                console.log(subscriptionResult);

                return subscriptionResult;
              }}
              onApprove={handleApprove}
              onError={(e) => console.log(e)}
            />
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
