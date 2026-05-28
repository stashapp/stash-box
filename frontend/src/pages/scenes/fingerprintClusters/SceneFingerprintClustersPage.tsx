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
import { ActiveClusterCard } from "./ActiveClusterCard";
import { ClusterDistanceCard } from "./ClusterDistanceCard";
import { ClusterMoveModal } from "./ClusterMoveModal";
import { ClusterPageProvider } from "./ClusterPageContext";
import { ClusterPickerCard } from "./ClusterPickerCard";
import { useActiveCluster } from "./hooks/useActiveCluster";
import { useClusterDistance } from "./hooks/useClusterDistance";
import { useClusterMove } from "./hooks/useClusterMove";
import { useExpandedRows } from "./hooks/useExpandedRows";
import { usePalette } from "./hooks/usePalette";
import type { Cluster } from "./types";
import { useClusterSelection } from "./useClusterSelection";
import { buildMoveSources } from "./utils";

interface Props {
  scene: Scene;
}

export const SceneFingerprintClustersPage: FC<Props> = ({ scene }) => {
  const { isModerator } = useCurrentUser();
  const { distance, debouncedDistance, setDistance } = useClusterDistance();

  const { data, loading, error, refetch } = useFingerprintClusters({
    input: { scene_id: scene.id, distance: debouncedDistance },
  });
  const clusters: Cluster[] = data?.fingerprintClusters ?? [];

  const { activeCluster, activeIndex, switchTo } = useActiveCluster(clusters);
  const paletteFor = usePalette(scene.id);
  const selection = useClusterSelection();
  const expandedRows = useExpandedRows();

  const [showMove, setShowMove] = useState(false);
  const { move, moving } = useClusterMove({
    refetch,
    onAfterMove: () => {
      selection.clear();
      setShowMove(false);
    },
  });

  const handleMove = useCallback(
    (targetSceneId: string) =>
      move(buildMoveSources(activeCluster, selection.selectedHashes), targetSceneId),
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
      openMoveModal={() => setShowMove(true)}
    >
      <Link to={`${scenePath}#fingerprints`} className="btn btn-link p-0 mb-2">
        <Icon icon={faArrowLeft} className="me-1" />
        Back to scene
      </Link>
      <h3 className="mb-2">
        Fingerprint clusters for{" "}
        <Link to={scenePath}>{scene.title || "Untitled"}</Link>
      </h3>
      <p className="text-muted">
        Phash fingerprints reachable from this scene within a Hamming distance.
        Node size scales with submission count; clusters that span more than 10
        scenes are flagged as poisoned.
      </p>

      <ClusterDistanceCard
        distance={distance}
        loading={loading}
        onChange={setDistance}
      />
      <ClusterPickerCard />
      {activeCluster && <ActiveClusterCard />}
      <ClusterMoveModal
        show={showMove}
        onHide={() => setShowMove(false)}
        onMove={handleMove}
      />
    </ClusterPageProvider>
  );
};
