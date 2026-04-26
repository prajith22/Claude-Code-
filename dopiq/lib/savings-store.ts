"use client";

import { create } from "zustand";

type SavingsState = {
  /** Bumped to trigger the SavingsHeader to re-fetch /api/savings/me. */
  version: number;
  bump: () => void;
};

export const useSavingsStore = create<SavingsState>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}));
