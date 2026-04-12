import { useState, useEffect } from 'react';

/**
 * Debounce a value — useful for search inputs to avoid excessive API calls.
 * @param value The value to debounce
 * @param delay Delay in ms (default: 300)
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced callback — useful for triggering side effects.
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay = 300,
): T {
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const debouncedFn = ((...args: any[]) => {
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => callback(...args), delay));
  }) as T;

  useEffect(() => {
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timer]);

  return debouncedFn;
}
