import { Button } from "@/components/ui/button";
import React, { Suspense } from "react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { SignOutButton } from "@clerk/nextjs";

export const AuthButton = async () => {
  const user = await currentUser();
  if (!user) {
    return (
      <Button asChild>
        <Link prefetch={true} href="/auth/sign-in">
          Sign In
        </Link>
      </Button>
    );
  }

  return (
    <Popover>
      <Suspense fallback={<div>Loading...</div>}>
        <PopoverTrigger>{user.firstName}</PopoverTrigger>
        <PopoverContent className="w-fit p-2 bg-destructive rounded-md">
          <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
            <button className="text-white">Sign Out</button>
          </SignOutButton>
        </PopoverContent>
      </Suspense>
    </Popover>
  );
};
