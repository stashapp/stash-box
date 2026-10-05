import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { type FC, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorMessage, Icon } from "src/components/fragments";
import { ROUTE_SCENE } from "src/constants/route";
import {
  type SceneFragment as Scene,
  useFingerprintClusters,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { ClusterPageProvider } from "./ClusterPageContext";
import { ActiveClusterCard } from "./components/ActiveClusterCard";
import { ClusterDistanceCard } from "./components/ClusterDistanceCard";
import { ClusterMoveModal } from "./components/ClusterMoveModal";
import { ClusterPickerCard } from "./components/ClusterPickerCard";
import { useActiveCluster } from "./hooks/useActiveCluster";
import {
  SLIDER_MAX,
  SLIDER_MODERATOR_THRESHOLD,
  useClusterDistance,
} from "./hooks/useClusterDistance";
import { useClusterMove } from "./hooks/useClusterMove";
import { useClusterSelection } from "./hooks/useClusterSelection";
import { useExpandedRows } from "./hooks/useExpandedRows";
import { usePalette } from "./hooks/usePalette";
import type { Cluster } from "./types";
import { buildMoveSources } from "./utils";

interface Props {
  scene: Scene;
}

export const SceneFingerprintClustersPage: FC<Props> = ({ scene }) => {
  const { isModerator } = useCurrentUser();
  const distanceMax = isModerator ? SLIDER_MAX : SLIDER_MODERATOR_THRESHOLD;
  const { distance, debouncedDistance, setDistance } =
    useClusterDistance(distanceMax);

  const { data, loading, error, refetch } = useFingerprintClusters({
    input: { scene_id: scene.id, distance: debouncedDistance },
  });
  const clusters: Cluster[] = data?.fingerprintClusters.clusters ?? [];
  const truncated = data?.fingerprintClusters.truncated ?? false;

  const { activeCluster, activeIndex, switchTo } = useActiveCluster(clusters);
  const paletteFor = usePalette(scene.id);
  const selection = useClusterSelection();
  const expandedRows = useExpandedRows();

  const [showMove, setShowMove] = useState(false);
  const openMoveModal = useCallback(() => setShowMove(true), []);
  const onAfterMove = useCallback(() => {
    selection.clear();
    setShowMove(false);
  }, [selection]);
  const { move, moving } = useClusterMove({ refetch, onAfterMove });

  const handleMove = useCallback(
    (targetSceneId: string, targetSceneTitle?: string) =>
      move(
        buildMoveSources(activeCluster, selection.selectedHashes),
        targetSceneId,
        targetSceneTitle,
      ),
    [move, activeCluster, selection.selectedHashes],
  );

  if (error) return <ErrorMessage error={error.message} />;

  const scenePath = ROUTE_SCENE.replace(":id", scene.id);

  return (
    <ClusterPageProvider
      clusters={clusters}
      activeCluster={activeCluster}
      activeIndex={activeIndex}
      switchTo={switchTo}
      seedSceneId={scene.id}
      isModerator={isModerator}
      paletteFor={paletteFor}
      distanceThreshold={debouncedDistance}
      selection={selection}
      expandedRows={expandedRows}
      moving={moving}
      openMoveModal={openMoveModal}
    >
      <Link to={`${scenePath}#fingerprints`} className="btn btn-link p-0 mb-2">
        <Icon icon={faArrowLeft} className="me-1" />
        Back to scene
      </Link>
      <h3 className="mb-2">
        Fingerprint clusters for <Link to={scenePath}>"{scene.title}"</Link>
      </h3>
      <p className="text-muted">
        Phash fingerprints reachable from this scene within a Hamming distance.
        Node size scales with submission count.
        <br />
        <b>Note:</b> At higher distances clusters can include unrelated scenes
        due to hash collision.
      </p>
      {truncated && (
        <div className="alert alert-warning">
          Expansion hit the search limits — some related fingerprints may be
          missing from these results. Try a lower distance.
        </div>
      )}

      <ClusterDistanceCard
        distance={distance}
        max={distanceMax}
        loading={loading}
        onChange={setDistance}
      />
      {!loading && (
        <>
          <ClusterPickerCard />
          {activeCluster && <ActiveClusterCard />}
        </>
      )}
      <ClusterMoveModal
        show={showMove}
        onHide={() => setShowMove(false)}
        onMove={handleMove}
      />
    </ClusterPageProvider>
  );
};
