import { useMemo } from "react";

const PALETTE = [
  "#4e79a7",
  "#f28e2b",
  "#e15759",
  "#76b7b2",
  "#59a14f",
  "#edc948",
  "#b07aa1",
  "#ff9da7",
  "#9c755f",
  "#bab0ac",
];

const sceneColor = (sceneId: string, palette: Map<string, string>) => {
  const existing = palette.get(sceneId);
  if (existing) return existing;
  const c = PALETTE[palette.size % PALETTE.length];
  palette.set(sceneId, c);
  return c;
};

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
