import { useStorage } from '@/hooks/useStorage';
import { SpendEntry } from './types';

export function useTracker() {
  const { value: entries, set } = useStorage<SpendEntry[]>('tracker_entries', []);

  const addEntry = (entry: Omit<SpendEntry, 'id'>) => {
    const newEntry: SpendEntry = { ...entry, id: `e_${Date.now()}` };
    set((prev) => [newEntry, ...prev]);
  };

  const deleteEntry = (id: string) => {
    set((prev) => prev.filter((e) => e.id !== id));
  };

  // Returns total spend for a given ISO week offset (0 = current, -1 = last week)
  const weekTotal = (weekOffset = 0): number => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    startOfWeek.setDate(now.getDate() - day + weekOffset * 7);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return entries
      .filter((e) => {
        const d = new Date(e.date);
        return d >= startOfWeek && d <= endOfWeek;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  };

  return { entries, addEntry, deleteEntry, weekTotal };
}
