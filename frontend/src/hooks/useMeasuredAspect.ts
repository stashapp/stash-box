import { useLayoutEffect, useState } from "react";

// Width over height of a rendered element, measured in a layout effect before first paint and kept current by
// a ResizeObserver; a hook rather than a ref-callback cleanup, which React 18 ignores
export const useMeasuredAspect = () => {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [aspect, setAspect] = useState<number>();

  useLayoutEffect(() => {
    if (!element) {
      return;
    }

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
