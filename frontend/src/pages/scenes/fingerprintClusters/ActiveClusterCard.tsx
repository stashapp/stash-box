import type { FC } from "react";
import { Card } from "react-bootstrap";
import { ClusterActionBar } from "./ClusterActionBar";
import { ClusterMembersTable } from "./ClusterMembersTable";
import { useClusterPage } from "./ClusterPageContext";

export const ActiveClusterCard: FC = () => {
  const { clusters, activeCluster, activeIndex, isModerator } =
    useClusterPage();
  if (!activeCluster) return null;
  return (
    <Card bg="dark" text="light" className="mb-3">
      <Card.Body>
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className="text-muted small">
            Showing cluster {activeIndex + 1} of {clusters.length}
          </span>
        </div>

        {isModerator && <ClusterActionBar />}

        <ClusterMembersTable />
      </Card.Body>
    </Card>
  );
};
