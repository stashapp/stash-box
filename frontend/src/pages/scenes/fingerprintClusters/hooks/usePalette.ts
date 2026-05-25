import { useCallback, useMemo } from "react";
import { sceneColor } from "../types";

/**
 * Stable scene-id → color mapping. The seed scene is inserted first so it
 * always gets the same palette slot.
 */
export const usePalette = (seedSceneId: string) => {
  const palette = useMemo(() => {
    const p = new Map<string, string>();
    sceneColor(seedSceneId, p);
    return p;
  }, [seedSceneId]);

  const paletteFor = useCallback(
    (id: string) => sceneColor(id, palette),
    [palette],
  );

  return paletteFor;
};
