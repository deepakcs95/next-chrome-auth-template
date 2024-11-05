import { auth, clerkClient } from "@clerk/nextjs/server";
import React from "react";
import Token from "../../(auth)/auth/_components/token";
import { TokenGenerator } from "@/lib/utils/tokenGenerator";
import { getUserById } from "@/lib/db";

export default async function page() {
  return <div>dashboard</div>;
}
