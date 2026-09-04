import { useLayoutEffect, useState } from "react";

/**
 * Width over height of a rendered element, kept current as it resizes
 *
 * Returns a callback ref to put on the element, and the last measured aspect
 * -- undefined until the element first has size. The first measurement runs
 * in a layout effect, before the browser paints: a ResizeObserver delivers
 * its first box a frame late, and whatever is sized from this would flash at
 * the wrong shape. The observer takes over from there.
 *
 * A hook rather than a cleanup returned from the ref callback: React 18
 * ignores a ref callback's return value (cleanups there arrive in 19), which
 * would silently leak the observer.
 */
export const useMeasuredAspect = () => {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [aspect, setAspect] = useState<number>();

  useLayoutEffect(() => {
    if (!element) return;

    const measure = (width: number, height: number) => {
      if (width > 0 && height > 0) setAspect(width / height);
    };

    const box = element.getBoundingClientRect();
    measure(box.width, box.height);

    const observer = new ResizeObserver(([entry]) =>
      measure(entry.contentRect.width, entry.contentRect.height),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return { ref: setElement, aspect };
};
