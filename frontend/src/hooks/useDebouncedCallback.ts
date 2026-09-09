import { debounce } from "lodash-es";
import { useEffect, useMemo, useRef } from "react";

export const useDebouncedCallback = <Args extends unknown[]>(
  callback: (...args: Args) => void,
  wait: number,
) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useMemo(
    () => debounce((...args: Args) => callbackRef.current(...args), wait),
    [wait],
  );

  useEffect(
    () => () => {
      debouncedCallback.cancel();
    },
    [debouncedCallback],
  );

  return debouncedCallback;
};
