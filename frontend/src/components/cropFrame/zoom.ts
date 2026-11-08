/** Zoom scales the rendered stage only; the crop rect stays in fractions of the image */
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 8;

const ZOOM_STEP = 1.25;

export const stepZoom = (zoom: number, direction: 1 | -1): number => {
  const stepped = zoom * ZOOM_STEP ** direction;
  if (stepped < MIN_ZOOM * 1.01) {
    return MIN_ZOOM;
  }
  return Math.min(stepped, MAX_ZOOM);
};

export const zoomCeiling = (
  zoom: number,
  crop: { width: number; height: number },
  viewport: { width: number; height: number },
): number => {
  // Nothing rendered yet, so nothing to measure against
  if (crop.width <= 0 || crop.height <= 0) {
    return MAX_ZOOM;
  }

  const room = Math.min(
    viewport.width / crop.width,
    viewport.height / crop.height,
  );
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * room));
};
