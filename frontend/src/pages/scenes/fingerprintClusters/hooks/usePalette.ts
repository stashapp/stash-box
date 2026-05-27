import { useMemo } from "react";
import { sceneColor } from "../types";

/**
 * Stable scene-id → color mapping. The seed scene is inserted first so it
 * always gets the same palette slot. The map is memoed because it's mutated
 * as new scene ids are encountered — a fresh map per render would reset.
 */
export const usePalette = (seedSceneId: string) => {
  const palette = useMemo(() => {
    const p = new Map<string, string>();
    sceneColor(seedSceneId, p);
    return p;
  }, [seedSceneId]);

  return (id: string) => sceneColor(id, palette);
};
