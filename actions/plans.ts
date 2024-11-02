"use server";

import prisma from "@/lib/db";

export async function getAvailablePlans() {
  try {
    const plans = await prisma.plan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        price: "asc",
      },
    });
    return { success: true, plans };
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    return { success: false, error: "Failed to fetch plans" };
  }
}

export async function getPlanById(planId: string) {
  try {
    const plan = await prisma.plan.findUnique({
      where: { paypalPlanId: planId },
    });
    return { success: true, plan };
  } catch (error) {
    console.error("Failed to fetch plan:", error);
    return { success: false, error: "Failed to fetch plan" };
  }
}
