import {
  type Fingerprint,
  type FingerprintQueryInput,
  useUnmatchFingerprint,
  useMoveFingerprintSubmissions,
  useDeleteFingerprintSubmissions,
} from "src/graphql";
import { useToast } from "src/hooks";
import type { MatchType } from "./types";

export const useFingerprintOperations = (sceneId: string) => {
  const addToast = useToast();

  const [unmatchFingerprint, { loading: unmatching }] = useUnmatchFingerprint();
  const [moveFingerprintSubmissions, { loading: moving }] =
    useMoveFingerprintSubmissions();
  const [deleteFingerprintSubmissions, { loading: deleting }] =
    useDeleteFingerprintSubmissions();

  const handleFingerprintUnmatch = async (
    fingerprint: Fingerprint,
    type: MatchType,
  ) => {
    if (unmatching) return;

    const { data } = await unmatchFingerprint({
      variables: {
        scene_id: sceneId,
        algorithm: fingerprint.algorithm,
        hash: fingerprint.hash,
        duration: fingerprint.duration,
      },
    });
    const success = data?.unmatchFingerprint;
    addToast({
      variant: success ? "success" : "danger",
      content: `${
        success ? "Removed" : "Failed to remove"
      } fingerprint ${type}`,
    });
  };

  const handleMoveFingerprints = async (
    fingerprints: FingerprintQueryInput[],
    targetSceneId: string,
  ) => {
    const { data } = await moveFingerprintSubmissions({
      variables: {
        input: {
          fingerprints,
          source_scene_id: sceneId,
          target_scene_id: targetSceneId,
        },
      },
    });

    const success = data?.sceneMoveFingerprintSubmissions;
    addToast({
      variant: success ? "success" : "danger",
      content: success
        ? `Moved ${fingerprints.length} fingerprint(s) to scene ${targetSceneId}`
        : "Failed to move fingerprints",
    });

    return success;
  };

  const handleDeleteFingerprints = async (
    fingerprints: FingerprintQueryInput[],
  ) => {
    const { data } = await deleteFingerprintSubmissions({
      variables: {
        input: {
          fingerprints,
          scene_id: sceneId,
        },
      },
    });

    const success = data?.sceneDeleteFingerprintSubmissions;
    addToast({
      variant: success ? "success" : "danger",
      content: success
        ? `Deleted ${fingerprints.length} fingerprint submission(s)`
        : "Failed to delete fingerprint submissions",
    });

    return success;
  };

  return {
    handleFingerprintUnmatch,
    handleMoveFingerprints,
    handleDeleteFingerprints,
    unmatching,
    moving,
    deleting,
  };
};
