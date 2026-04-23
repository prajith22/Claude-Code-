import { useStorage } from '@/hooks/useStorage';
import { OnboardingAnswers } from './types';

const DEFAULT: OnboardingAnswers = {
  shoppingCategories: [],
  foodCuisines: [],
  orderSize: 'Just me',
  sports: ['NFL', 'NBA'],
  completed: false,
};

export function useOnboarding() {
  const { value, set, loading } = useStorage<OnboardingAnswers>('onboarding', DEFAULT);
  return { onboarding: value, setOnboarding: set, loading };
}
