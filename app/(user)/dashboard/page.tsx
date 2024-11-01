import { auth, clerkClient } from "@clerk/nextjs/server";
import React from "react";
import Token from "../../(auth)/auth/_components/token";
import { TokenGenerator } from "@/lib/utils/tokenGenerator";
import { getUserById } from "@/lib/db";

export default async function page() {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    return redirectToSignIn();
  }

  console.log(userId);

  const user = await getUserById(userId);
  if (!user) {
    await (await clerkClient()).users.deleteUser(userId);
    redirectToSignIn();
  }

  const token = await TokenGenerator.generateJWT({ userId });

  return (
    <div>
      <h1></h1>
      <Token action="login" name={user?.name!} email={user?.email!} token={token} />
    </div>
  );
}
