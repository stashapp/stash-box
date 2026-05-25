import type { FC } from "react";
import { Card } from "react-bootstrap";
import { ClusterCanvas } from "./ClusterCanvas";
import { ClusterList } from "./ClusterList";
import type { Cluster, ClusterMember } from "./types";

interface Props {
  clusters: Cluster[];
  activeCluster?: Cluster;
  activeClusterId?: string;
  seedSceneId: string;
  paletteFor: (id: string) => string;
  selectedHashes: Set<string>;
  onSelectCluster: (clusterId: string) => void;
  onToggleMember: (member: ClusterMember) => void;
}

export const ClusterPickerCard: FC<Props> = ({
  clusters,
  activeCluster,
  activeClusterId,
  seedSceneId,
  paletteFor,
  selectedHashes,
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
            activeClusterId={activeClusterId}
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
