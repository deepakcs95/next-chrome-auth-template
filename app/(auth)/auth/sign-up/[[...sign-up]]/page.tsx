import { Skeleton } from "@/components/ui/skeleton";
import { SignIn, SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function Page() {
  const { userId } = await auth();

  if (userId) {
    redirect("/");
  }

  return (
    <Suspense fallback={<Skeleton className="w-full h-full rounded-full" />}>
      <div className="flex flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "bg-transparent shadow-none",
            },
          }}
        />
      </div>
    </Suspense>
  );
}
