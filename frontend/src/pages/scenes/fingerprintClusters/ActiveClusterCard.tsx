import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Alert, Badge, Card } from "react-bootstrap";
import { Icon } from "src/components/fragments";
import { ClusterActionBar } from "./ClusterActionBar";
import { ClusterMembersTable } from "./ClusterMembersTable";
import type { Cluster } from "./types";

interface Props {
  cluster: Cluster;
  clusterIndex: number;
  clusterCount: number;
  seedSceneId: string;
  sceneNames: Map<string, string>;
  paletteFor: (id: string) => string;
  isModerator: boolean;
  selectedHashCount: number;
  multiSceneHashCount: number;
  moving: boolean;
  onClear: () => void;
  onSelectMultiScene: () => void;
  onMoveClick: () => void;
  isHashSelected: (hash: string) => boolean;
  onToggleHash: (hash: string) => void;
  expandedHashes: Set<string>;
  onToggleExpand: (rowKey: string) => void;
}

export const ActiveClusterCard: FC<Props> = ({
  cluster,
  clusterIndex,
  clusterCount,
  seedSceneId,
  sceneNames,
  paletteFor,
  isModerator,
  selectedHashCount,
  multiSceneHashCount,
  moving,
  onClear,
  onSelectMultiScene,
  onMoveClick,
  isHashSelected,
  onToggleHash,
  expandedHashes,
  onToggleExpand,
}) => {
  const poisoned = cluster.poisoned;
  return (
    <Card bg="dark" text="light" className="mb-3">
      <Card.Body>
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className="text-muted small">
            Showing cluster {clusterIndex + 1} of {clusterCount}
          </span>
          {poisoned && (
            <Badge bg="danger">
              <Icon icon={faExclamationTriangle} className="me-1" />
              poisoned (&gt;10 scenes)
            </Badge>
          )}
        </div>

        {poisoned && (
          <Alert variant="warning" className="py-2">
            This cluster spans more than 10 scenes. Move/delete are disabled;
            triage manually.
          </Alert>
        )}

        {isModerator && !poisoned && (
          <ClusterActionBar
            selectedHashCount={selectedHashCount}
            multiSceneHashCount={multiSceneHashCount}
            moving={moving}
            onClear={onClear}
            onSelectMultiScene={onSelectMultiScene}
            onMoveClick={onMoveClick}
          />
        )}

        <ClusterMembersTable
          cluster={cluster}
          seedSceneId={seedSceneId}
          sceneNames={sceneNames}
          paletteFor={paletteFor}
          isModerator={isModerator}
          isHashSelected={isHashSelected}
          onToggleHash={onToggleHash}
          expandedHashes={expandedHashes}
          onToggleExpand={onToggleExpand}
        />
      </Card.Body>
    </Card>
  );
};
