import type { FC } from "react";
import { Card } from "react-bootstrap";
import { ClusterCanvas } from "./ClusterCanvas";
import { ClusterList } from "./ClusterList";
import type { Cluster, ClusterMember } from "./types";

interface Props {
  clusters: Cluster[];
  activeCluster?: Cluster;
  activeIndex: number;
  seedSceneId: string;
  paletteFor: (id: string) => string;
  selectedHashes: Set<string>;
  distanceThreshold: number;
  onSelectCluster: (index: number) => void;
  onToggleMember: (member: ClusterMember) => void;
}

export const ClusterPickerCard: FC<Props> = ({
  clusters,
  activeCluster,
  activeIndex,
  seedSceneId,
  paletteFor,
  selectedHashes,
  distanceThreshold,
  onSelectCluster,
  onToggleMember,
}) => (
  <Card bg="dark" text="light" className="mb-3">
    <Card.Body>
      <div className="d-flex gap-3" style={{ minHeight: 520 }}>
        <div
          style={{
            width: 320,
            flexShrink: 0,
            maxHeight: 620,
            overflowY: "auto",
          }}
        >
          <ClusterList
            clusters={clusters}
            seedSceneId={seedSceneId}
            activeIndex={activeIndex}
            paletteFor={paletteFor}
            onSelect={onSelectCluster}
          />
        </div>
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          {activeCluster ? (
            <ClusterCanvas
              cluster={activeCluster}
              seedSceneId={seedSceneId}
              paletteFor={paletteFor}
              selectedHashes={selectedHashes}
              distanceThreshold={distanceThreshold}
              onToggleMember={onToggleMember}
            />
          ) : (
            <div className="text-muted py-4 text-center">
              Select a cluster from the list to inspect it.
            </div>
          )}
        </div>
      </div>
    </Card.Body>
  </Card>
);
