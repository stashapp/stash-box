import { useEffect, useState } from "react";

export const SLIDER_MIN = 2;
export const SLIDER_MAX = 8;
export const SLIDER_STEP = 2;

/** Snap an arbitrary number into the slider's valid even-only range. */
export const snapDistance = (n: number): number => {
  const even = Math.round(n / 2) * 2;
  return Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, even));
};

/**
 * Slider state + debounced value. `distance` updates immediately on user
 * input; `debouncedDistance` lags by `debounceMs` so we don't re-fire the
 * cluster query on every keystroke.
 */
export const useClusterDistance = (
  initial: number = SLIDER_MAX,
  debounceMs = 300,
) => {
  const [distance, setRawDistance] = useState<number>(snapDistance(initial));
  const [debouncedDistance, setDebouncedDistance] = useState<number>(distance);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedDistance(distance), debounceMs);
    return () => clearTimeout(t);
  }, [distance, debounceMs]);

  const setDistance = (n: number) => setRawDistance(snapDistance(n));

  return { distance, debouncedDistance, setDistance };
};
