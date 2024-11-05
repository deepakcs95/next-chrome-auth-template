import { getCurrentSubscription } from "@/actions/subscription";
import PayPalButton from "@/components/subscription/PayPalButton";
import { getAllPlans } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { Plan } from "@prisma/client";

export default async function page() {
  const session = await auth();
  const userId = session.userId;

  const [plans, currentSubscription] = await Promise.all([
    getAllPlans(),
    userId ? getCurrentSubscription(userId) : Promise.resolve(null),
  ]);

  if (!plans) {
    return <div>No plans available</div>;
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {plans.map((plan: Plan) => {
        const isCurrentPlan = currentSubscription?.planId === plan.id;
        const hasActiveSubscription = currentSubscription?.status === "active";
        const isPendingSubscription =
          currentSubscription?.status === "pending" && currentSubscription?.planId === plan.id;
        return (
          <div
            key={plan.id}
            className="rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow duration-200 mb-4"
          >
            <div className="p-6">
              <h3 className="text-2xl font-semibold leading-none tracking-tight">{plan.name}</h3>
              <div className="mt-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/{plan.interval}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {/* Adjust this part based on your plan features structure */}
                {plan.description && (
                  <li className="flex items-center text-sm">
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
                    {plan.description}
                    <span>{plan.paypalPlanId}</span>
                    {hasActiveSubscription ? (
                      <PayPalButton
                        key={"paid"}
                        planId={plan.paypalPlanId}
                        hasActiveSubscription
                        userId={userId}
                        subscritptionId={currentSubscription.SubscriptionId}
                      />
                    ) : (
                      <PayPalButton
                        key={"free"}
                        hasActiveSubscription={false}
                        planId={plan.paypalPlanId}
                      />
                    )}
                  </li>
                )}
              </ul>
            </div>
            <div className="p-6 pt-0"></div>
          </div>
        );
      })}
    </div>
  );
}
