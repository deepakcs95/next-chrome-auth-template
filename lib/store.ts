import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SubscriptionTier = "free" | "pro" | "enterprise";

interface SubscriptionState {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: string | null;
  setTier: (tier: SubscriptionTier) => void;
  setActive: (status: boolean) => void;
  setExpiration: (date: string) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      tier: "free",
      isActive: false,
      expiresAt: null,
      setTier: (tier) => set({ tier }),
      setActive: (status) => set({ isActive: status }),
      setExpiration: (date) => set({ expiresAt: date }),
    }),
    {
      name: "subscription-storage",
    }
  )
);
