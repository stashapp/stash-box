import { CombinedGraphQLErrors } from "@apollo/client";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { type FC, useCallback, useMemo, useState } from "react";
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
import { ClusterPickerCard } from "./ClusterPickerCard";
import { useActiveCluster } from "./hooks/useActiveCluster";
import { useClusterDistance } from "./hooks/useClusterDistance";
import { useClusterMove } from "./hooks/useClusterMove";
import { useExpandedRows } from "./hooks/useExpandedRows";
import { usePalette } from "./hooks/usePalette";
import type { Cluster, ClusterMember } from "./types";
import { useClusterSelection } from "./useClusterSelection";
import {
  buildMoveCandidates,
  expandSelectionToMemberKeys,
  expandWithLinkedOshashes,
  multiSceneHashes as multiSceneHashesOf,
  sceneNameMap,
  selectedMembers as selectedMembersOf,
  sumSelectedSubmissions,
} from "./utils";

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

  const { activeCluster, activeClusterId, switchTo } =
    useActiveCluster(clusters);
  const paletteFor = usePalette(scene.id);
  const sceneNames = useMemo(
    () => sceneNameMap(activeCluster),
    [activeCluster],
  );

  const { selectedHashes, toggle, setMany, clear, isSelected } =
    useClusterSelection();

  const selectedKeys = useMemo(
    () => expandSelectionToMemberKeys(activeCluster, selectedHashes),
    [activeCluster, selectedHashes],
  );
  const expandedSelection = useMemo(
    () => expandWithLinkedOshashes(activeCluster, selectedKeys),
    [activeCluster, selectedKeys],
  );
  const linkedOshashCount = expandedSelection.length - selectedKeys.length;
  const selectedSubmissionCount = useMemo(
    () => sumSelectedSubmissions(activeCluster, selectedHashes),
    [activeCluster, selectedHashes],
  );
  const selectedMembers = useMemo(
    () => selectedMembersOf(activeCluster, selectedHashes),
    [activeCluster, selectedHashes],
  );
  const moveCandidates = useMemo(
    () => buildMoveCandidates(activeCluster),
    [activeCluster],
  );
  const multiSceneHashList = useMemo(
    () => multiSceneHashesOf(activeCluster),
    [activeCluster],
  );

  const onToggleMember = useCallback(
    (member: ClusterMember, clusterId: string) => {
      if (switchTo(clusterId)) {
        clear();
        setMany([member.hash], true);
        return;
      }
      toggle(member.hash);
    },
    [switchTo, clear, setMany, toggle],
  );

  const selectMultiSceneHashes = () => {
    if (multiSceneHashList.length === 0) return;
    clear();
    setMany(multiSceneHashList, true);
  };

  const { expanded: expandedOshashKeys, toggle: toggleOshashExpand } =
    useExpandedRows();

  const [showMove, setShowMove] = useState(false);
  const { move, moving } = useClusterMove({
    refetch,
    onAfterMove: () => {
      clear();
      setShowMove(false);
    },
  });
  const handleMove = useCallback(
    (targetSceneId: string) => move(expandedSelection, targetSceneId),
    [move, expandedSelection],
  );

  if (error) {
    let code: string | undefined;
    if (CombinedGraphQLErrors.is(error)) {
      const ext = error.errors?.[0]?.extensions as
        | { code?: string }
        | undefined;
      code = ext?.code;
    }
    if (code === "BKTREE_REQUIRED") {
      return (
        <ErrorMessage error="The bktree Postgres extension is required for phash distance clustering, but is not installed on this database." />
      );
    }
    return <ErrorMessage error={error.message} />;
  }

  const scenePath = ROUTE_SCENE.replace(":id", scene.id);
  const fingerprintsPath = `${scenePath}#fingerprints`;

  return (
    <div>
      <Link to={fingerprintsPath} className="btn btn-link p-0 mb-2">
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

      <ClusterPickerCard
        clusters={clusters}
        activeCluster={activeCluster}
        activeClusterId={activeClusterId}
        seedSceneId={scene.id}
        paletteFor={paletteFor}
        selectedHashes={selectedHashes}
        onSelectCluster={(clusterId) => {
          if (switchTo(clusterId)) clear();
        }}
        onToggleMember={(member) => {
          if (activeCluster) onToggleMember(member, activeCluster.id);
        }}
      />

      {activeCluster && (
        <ActiveClusterCard
          cluster={activeCluster}
          clusterIndex={clusters.indexOf(activeCluster)}
          clusterCount={clusters.length}
          seedSceneId={scene.id}
          sceneNames={sceneNames}
          paletteFor={paletteFor}
          isModerator={isModerator}
          selectedHashCount={selectedHashes.size}
          multiSceneHashCount={multiSceneHashList.length}
          moving={moving}
          onClear={clear}
          onSelectMultiScene={selectMultiSceneHashes}
          onMoveClick={() => setShowMove(true)}
          isHashSelected={isSelected}
          onToggleHash={toggle}
          expandedHashes={expandedOshashKeys}
          onToggleExpand={toggleOshashExpand}
        />
      )}

      <ClusterMoveModal
        show={showMove}
        hashCount={selectedHashes.size}
        submissionCount={selectedSubmissionCount}
        linkedOshashCount={linkedOshashCount}
        candidates={moveCandidates}
        selectedMembers={selectedMembers}
        sceneNames={sceneNames}
        seedSceneId={scene.id}
        paletteFor={paletteFor}
        moving={moving}
        onHide={() => setShowMove(false)}
        onMove={handleMove}
      />

    </div>
  );
};
