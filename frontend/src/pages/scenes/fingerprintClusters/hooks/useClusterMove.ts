import { useCallback } from "react";
import { useMoveFingerprintSubmissions } from "src/graphql";
import { useToast } from "src/hooks";
import type { MemberKey } from "../types";
import { groupBySource } from "../utils";

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
    async (selection: MemberKey[], targetSceneId: string) => {
      const groups = groupBySource(selection);
      groups.delete(targetSceneId);
      let allOk = true;
      let total = 0;
      for (const [sourceSceneId, fingerprints] of groups.entries()) {
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
      addToast({
        variant: allOk ? "success" : "danger",
        content: allOk
          ? `Moved ${total} fingerprint submission(s) to ${targetSceneId}`
          : "One or more move operations failed",
      });
      if (allOk) onAfterMove?.();
      await refetch();
      return allOk;
    },
    [moveFingerprints, addToast, onAfterMove, refetch],
  );

  return { move, moving };
};
