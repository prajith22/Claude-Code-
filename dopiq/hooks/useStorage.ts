import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

export function useStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(key).then((raw) => {
      if (raw !== null) {
        try {
          setValue(JSON.parse(raw));
        } catch {
          setValue(defaultValue);
        }
      }
      setLoading(false);
    });
  }, [key]);

  const set = useCallback(
    async (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        AsyncStorage.setItem(key, JSON.stringify(resolved));
        return resolved;
      });
    },
    [key]
  );

  const clear = useCallback(async () => {
    await AsyncStorage.removeItem(key);
    setValue(defaultValue);
  }, [key, defaultValue]);

  return { value, set, clear, loading };
}
