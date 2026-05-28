import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Alert, Badge, Card } from "react-bootstrap";
import { Icon } from "src/components/fragments";
import { ClusterActionBar } from "./ClusterActionBar";
import { ClusterMembersTable } from "./ClusterMembersTable";
import { useClusterPage } from "./ClusterPageContext";

export const ActiveClusterCard: FC = () => {
  const { clusters, activeCluster, activeIndex, isModerator } =
    useClusterPage();
  if (!activeCluster) return null;
  const poisoned = activeCluster.poisoned;
  return (
    <Card bg="dark" text="light" className="mb-3">
      <Card.Body>
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className="text-muted small">
            Showing cluster {activeIndex + 1} of {clusters.length}
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

        {isModerator && !poisoned && <ClusterActionBar />}

        <ClusterMembersTable />
      </Card.Body>
    </Card>
  );
};
