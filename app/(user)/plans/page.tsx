import { getCurrentSubscription } from "@/actions/subscription";
import PayButton from "@/components/subscription/PayPalButton";
import { getAllPlans } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { Plan, Subscription } from "@prisma/client";

// New PlanDisplay component
function PlanDisplay({
  plan,
  hasActiveSubscription,
  userId,
  currentSubscription,
}: {
  plan: Plan;
  hasActiveSubscription: boolean;
  userId: string;
  currentSubscription?: Subscription | null;
}) {
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
          {plan.description && (
            <li className="flex flex-col items-center text-sm">
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
              <SubscriptionButton
                plan={plan}
                hasActiveSubscription={hasActiveSubscription}
                userId={userId}
                currentSubscription={currentSubscription}
              />
            </li>
          )}
        </ul>
      </div>
      <div className="p-6 pt-0"></div>
    </div>
  );
}

// New SubscriptionButton component
function SubscriptionButton({
  plan,
  hasActiveSubscription,
  userId,
  currentSubscription,
}: {
  plan: Plan;
  hasActiveSubscription: boolean;
  userId: string;
  currentSubscription?: Subscription | null;
}) {
  return userId ? (
    <PayButton
      key={plan.paypalPlanId}
      planId={plan.paypalPlanId}
      hasActiveSubscription={hasActiveSubscription}
      status={currentSubscription?.status}
      userId={userId}
      subscritptionId={currentSubscription?.SubscriptionId}
    />
  ) : (
    <PayButton key={plan.paypalPlanId} hasActiveSubscription={false} planId={plan.paypalPlanId} />
  );
}

export default async function page() {
  const { userId } = await auth();

  const [plans, getSubscription] = await Promise.all([
    getAllPlans(),
    userId ? getCurrentSubscription(userId) : Promise.resolve(null),
  ]);

  if (!plans) {
    return <div>No plans available</div>;
  }
  const currentSubscription = getSubscription?.subscription || null;
  // console.log(getSubscription);

  return (
    <div className="w-full max-w-sm mx-auto">
      {plans.map((plan: Plan) => {
        const hasActiveSubscription = currentSubscription?.planId === plan.paypalPlanId;
        return (
          <PlanDisplay
            key={plan.paypalPlanId}
            plan={plan}
            hasActiveSubscription={hasActiveSubscription}
            userId={userId!}
            currentSubscription={currentSubscription}
          />
        );
      })}
    </div>
  );
}
