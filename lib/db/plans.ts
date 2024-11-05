import { Plan } from "@prisma/client";
import prisma from "./client";
import { cache } from "react";

export const getAllPlans = cache(async (): Promise<Plan[] | null> => {
  try {
    const plans = await prisma.plan.findMany();
    return plans;
  } catch (error) {
    console.error("Error retrieving plans:", error);
    return null;
  }
});
