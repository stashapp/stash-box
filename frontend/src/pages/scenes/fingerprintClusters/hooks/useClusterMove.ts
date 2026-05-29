import { useCallback } from "react";
import { useMoveFingerprintSubmissions } from "src/graphql";
import { useToast } from "src/hooks";
import type { MoveRow } from "../utils";

interface Options {
  /** Called after the mutation(s) succeed and we've refetched. */
  onAfterMove?: () => void;
  refetch: () => Promise<unknown>;
}

/**
 * Wraps the sceneMoveFingerprintSubmissions mutation, dispatching one call
 * per distinct source scene since the mutation is per-source.
 */
export const useClusterMove = ({ onAfterMove, refetch }: Options) => {
  const addToast = useToast();
  const [moveFingerprints, { loading: moving }] =
    useMoveFingerprintSubmissions();

  const move = useCallback(
    async (
      sources: Map<string, MoveRow[]>,
      targetSceneId: string,
      targetSceneTitle?: string,
    ) => {
      let allOk = true;
      let total = 0;
      for (const [sourceSceneId, fingerprints] of sources) {
        if (sourceSceneId === targetSceneId) continue;
        try {
          const { data: res } = await moveFingerprints({
            variables: {
              input: {
                fingerprints,
                source_scene_id: sourceSceneId,
                target_scene_id: targetSceneId,
              },
            },
          });
          if (res?.sceneMoveFingerprintSubmissions)
            total += fingerprints.length;
          else allOk = false;
        } catch {
          allOk = false;
        }
      }
      const targetLabel = targetSceneTitle || targetSceneId;
      addToast({
        variant: allOk ? "success" : "danger",
        content: allOk
          ? `Moved ${total} fingerprint submission(s) to ${targetLabel}`
          : "One or more move operations failed",
      });
      await refetch();
      if (allOk) onAfterMove?.();
      return allOk;
    },
    [moveFingerprints, addToast, onAfterMove, refetch],
  );

  return { move, moving };
};
