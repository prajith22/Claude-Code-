import { useStorage } from '@/hooks/useStorage';

interface SubscriptionState {
  trialStartDate: string | null;
  isSubscribed: boolean;
}

const TRIAL_DAYS = 30;

export function useSubscription() {
  const { value, set } = useStorage<SubscriptionState>('subscription', {
    trialStartDate: null,
    isSubscribed: false,
  });

  const startTrial = () => {
    if (!value.trialStartDate) {
      set({ trialStartDate: new Date().toISOString(), isSubscribed: false });
    }
  };

  const setSubscribed = (subscribed: boolean) => {
    set((prev) => ({ ...prev, isSubscribed: subscribed }));
  };

  const trialActive = (): boolean => {
    if (!value.trialStartDate) return false;
    const started = new Date(value.trialStartDate);
    const now = new Date();
    const diffDays = (now.getTime() - started.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays < TRIAL_DAYS;
  };

  const daysLeft = (): number => {
    if (!value.trialStartDate) return TRIAL_DAYS;
    const started = new Date(value.trialStartDate);
    const now = new Date();
    const diffDays = (now.getTime() - started.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(TRIAL_DAYS - diffDays));
  };

  const hasAccess = value.isSubscribed || trialActive();

  return { hasAccess, isSubscribed: value.isSubscribed, trialActive, daysLeft, startTrial, setSubscribed };
}
